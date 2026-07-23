import {
  Component, inject, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { debounceTime, switchMap, distinctUntilChanged, filter } from 'rxjs/operators';
import { AppointmentService } from '../../../core/services/appointment.service';
import { PatientService } from '../../../core/services/patient.service';
import { InterventionService } from '../../../core/services/intervention.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ReportService } from '../../../core/services/report.service';
import { ClinicInfoService } from '../../../core/services/clinic-info.service';
import { letterheadHtml, letterheadStyles, fetchLogoAsBase64 } from '../../../core/print-letterhead';
import { Appointment, AppointmentStatus, CatalogItem, Intervention, Patient } from '../../../core/models';
import { STATUS_LABELS, INTERVENTION_COLORS, APPOINTMENT_STATUSES } from '../../../core/constants';
import { AppointmentReport } from '../../../core/services/report.service';
import { ToothChartComponent } from '../../../shared/components/tooth-chart';
import { ToothPickerDialogComponent } from './tooth-picker-dialog.component';
import { PaymentDialogComponent } from './payment-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

interface DraftIntervention {
  name: string;
  price: number;
  teeth: number[];
  note?: string;
}

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DatePipe, DecimalPipe, RouterLink,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatAutocompleteModule, MatTooltipModule,
    MatDividerModule, MatChipsModule, MatMenuModule,
    ToothChartComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './appointment-detail.component.html',
  styleUrl: './appointment-detail.component.scss',
})
export class AppointmentDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apptSvc = inject(AppointmentService);
  private patientSvc = inject(PatientService);
  private intSvc = inject(InterventionService);
  private catalogSvc = inject(CatalogService);
  private paySvc = inject(PaymentService);
  private reportSvc = inject(ReportService);
  private clinicInfoSvc = inject(ClinicInfoService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private logoBase64 = signal<string | undefined>(undefined);

  // Debounced catalog search
  private catalogSearch$ = new Subject<string>();
  private searchSub: any;

  loading = signal(true);
  appointment = signal<Appointment | null>(null);
  patient = signal<Patient | null>(null);
  interventions = signal<Intervention[]>([]);

  // Local draft (not persisted until submit)
  draft = signal<DraftIntervention | null>(null);

  catalogSuggestions = signal<CatalogItem[]>([]);
  submitting = signal(false);

  interventionTeethMap = computed(() => {
    const map = new Map<number, string>();
    this.interventions().forEach((int, idx) => {
      const color = INTERVENTION_COLORS[idx % INTERVENTION_COLORS.length];
      int.teeth.forEach(t => map.set(t, color));
    });
    // Include draft teeth with a distinct color
    const d = this.draft();
    if (d) {
      const color = INTERVENTION_COLORS[this.interventions().length % INTERVENTION_COLORS.length];
      d.teeth.forEach(t => map.set(t, color));
    }
    return map;
  });

  totalCharged = computed(() => this.interventions().reduce((s, i) => s + i.price, 0));
  totalPaid = computed(() => this.interventions().reduce((s, i) => s + i.paidAmount, 0));

  durationMinutes = computed(() => {
    const a = this.appointment();
    if (!a) return 0;
    return Math.round((new Date(a.endsAt).getTime() - new Date(a.startsAt).getTime()) / 60000);
  });

  statusLabel = (s: string) => STATUS_LABELS[s] ?? s;

  readonly statusOptions = APPOINTMENT_STATUSES.map(s => s.key);

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    fetchLogoAsBase64(this.clinicInfoSvc.clinicInfo().logoUrl).then(b64 => this.logoBase64.set(b64));
    this.apptSvc.getById(id).subscribe({
      next: a => {
        this.appointment.set(a);
        this.loading.set(false);
        this.patientSvc.getById(a.patientId).subscribe(p => this.patient.set(p));
        this.loadInterventions(a.id);
      },
      error: () => this.router.navigate(['/calendar']),
    });

    // Debounced catalog search (300ms)
    this.searchSub = this.catalogSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(q => q.length >= 1),
      switchMap(q => this.catalogSvc.search(q)),
    ).subscribe(items => this.catalogSuggestions.set(items));
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  private loadInterventions(appointmentId: number): void {
    this.intSvc.getByAppointment(appointmentId).subscribe({
      next: list => this.interventions.set(list),
      error: () => this.snackBar.open('Грешка при вчитување на интервенции', 'OK'),
    });
  }

  setStatus(status: AppointmentStatus): void {
    if (status === 'cancelled' || status === 'no-show') {
      const label = status === 'cancelled' ? 'откажана' : 'не дојде';
      const ref = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: 'Промена на статус',
          message: `Дали сте сигурни дека сакате да го промените статусот во "${label}"?`,
          confirmText: 'Промени',
          warn: true,
        },
      });
      ref.afterClosed().subscribe(confirmed => {
        if (!confirmed) return;
        const a = this.appointment()!;
        this.apptSvc.updateStatus(a.id, status).subscribe(updated => {
          this.appointment.set(updated);
        });
      });
      return;
    }
    const a = this.appointment()!;
    this.apptSvc.updateStatus(a.id, status).subscribe(updated => {
      this.appointment.set(updated);
    });
  }

  // ── Draft management ─────────────────────────────────────────────

  addIntervention(): void {
    // Create a local draft, no API call
    this.draft.set({ name: '', price: 0, teeth: [] });
  }

  cancelDraft(): void {
    this.draft.set(null);
    this.catalogSuggestions.set([]);
  }

  onDraftNameQuery(q: string): void {
    this.draft.update(d => d ? { ...d, name: q } : d);
    this.catalogSearch$.next(q);
  }

  onDraftCatalogSelect(item: CatalogItem): void {
    const d = this.draft();
    if (d && d.price > 0 && d.price !== item.lastPrice) {
      const ref = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: 'Промена на цена',
          message: `Цената ќе се промени од ${d.price} на ${item.lastPrice} ден. Продолжи?`,
          confirmText: 'Промени',
        },
      });
      ref.afterClosed().subscribe(confirmed => {
        if (!confirmed) {
          this.draft.update(d => d ? { ...d, name: item.name } : d);
        } else {
          this.draft.update(d => d ? { ...d, name: item.name, price: item.lastPrice } : d);
        }
      });
      return;
    }
    this.draft.update(d => d ? { ...d, name: item.name, price: item.lastPrice } : d);
  }

  updateDraftPrice(value: string): void {
    const n = parseFloat(value);
    if (isNaN(n)) return;
    this.draft.update(d => d ? { ...d, price: n } : d);
  }

  openDraftToothPicker(): void {
    const d = this.draft();
    if (!d) return;
    const ref = this.dialog.open(ToothPickerDialogComponent, {
      width: '600px',
      data: { selected: [...d.teeth] },
    });
    ref.afterClosed().subscribe((teeth: number[] | undefined) => {
      if (teeth === undefined) return;
      this.draft.update(d => d ? { ...d, teeth } : d);
    });
  }

  submitDraft(): void {
    const d = this.draft();
    const a = this.appointment();
    if (!d || !a) return;

    if (!d.name?.trim() || d.price <= 0) {
      this.snackBar.open('Име и цена мора да бидат пополнети', 'OK', { duration: 3000 });
      return;
    }

    this.submitting.set(true);
    this.intSvc.create(a.id, {
      name: d.name,
      price: d.price,
      teeth: d.teeth,
      note: d.note,
    }).subscribe({
      next: () => {
        this.draft.set(null);
        this.catalogSuggestions.set([]);
        this.submitting.set(false);
        this.loadInterventions(a.id);
        this.snackBar.open('Интервенцијата е зачувана', 'OK', { duration: 3000 });
      },
      error: () => {
        this.submitting.set(false);
        this.snackBar.open('Неуспешно зачувување', 'OK', { duration: 3000 });
      }
    });
  }

  // ── Existing intervention management ─────────────────────────────

  removeIntervention(id: number): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Бришење на интервенција',
        message: 'Дали сте сигурни? Ова ќе ги избрише и сите поврзани уплати.',
        confirmText: 'Избриши',
        warn: true,
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.intSvc.delete(id).subscribe(() => {
        this.interventions.update(list => list.filter(i => i.id !== id));
      });
    });
  }

  openToothPicker(intervention: Intervention): void {
    const ref = this.dialog.open(ToothPickerDialogComponent, {
      width: '600px',
      data: { selected: [...intervention.teeth] },
    });
    ref.afterClosed().subscribe((teeth: number[] | undefined) => {
      if (teeth === undefined) return;
      this.intSvc.update(intervention.id, {
        name: intervention.name,
        price: intervention.price,
        teeth,
        note: intervention.note,
      }).subscribe(updated => {
        this.interventions.update(list => list.map(i => i.id === updated.id ? updated : i));
      });
    });
  }

  openPayment(intervention: Intervention): void {
    const ref = this.dialog.open(PaymentDialogComponent, {
      width: '380px',
      data: { outstanding: intervention.outstanding },
    });
    ref.afterClosed().subscribe((result: { amount: number; method: string } | undefined) => {
      if (!result) return;
      this.paySvc.create(intervention.id, {
        amount: result.amount,
        method: result.method as any,
      }).subscribe(() => {
        this.loadInterventions(this.appointment()!.id);
        this.snackBar.open('Уплатата е евидентирана', 'OK', { duration: 3000 });
      });
    });
  }

  printReport(): void {
    const a = this.appointment();
    if (!a) return;
    this.clinicInfoSvc.ensureLoaded().pipe(
      switchMap(() => this.reportSvc.appointmentReport(a.id))
    ).subscribe(r => {
      const fmt = (n: number) => n.toLocaleString('mk-MK');
      const fmtDate = (iso: string | null) => {
        if (!iso) return '—';
        const d = new Date(iso);
        return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
      };
      const fmtTime = (iso: string) => {
        const d = new Date(iso);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      };
      const dur = Math.round((new Date(r.endsAt).getTime() - new Date(r.startsAt).getTime()) / 60000);
      const sl = (s: string) => STATUS_LABELS[s?.toLowerCase()] ?? s;

      const intRows = r.interventions.map(i =>
        `<tr><td>${i.name}</td><td>${[...i.teeth].sort((x, y) => x - y).join(', ') || '—'}</td>
         <td class="num">${fmt(i.price)}</td><td class="num">${fmt(i.paidAmount)}</td>
         <td class="num${i.outstanding > 0 ? ' debt' : ''}">${fmt(i.outstanding)}</td>
         ${i.note ? `<td>${i.note}</td>` : '<td>—</td>'}</tr>`
      ).join('');

      const patientInfo = `${r.firstName} ${r.lastName}` +
        (r.dateOfBirth ? ` · Роден/а: ${fmtDate(r.dateOfBirth)}` : '') +
        (r.phone ? ` · Тел: ${r.phone}` : '');

      const now = new Date();
      const fmtNow = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Извештај за средба — ${r.firstName} ${r.lastName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #222; font-size: 13px; }
  h1 { font-size: 18px; font-weight: 600; margin-bottom: 2px; }
  h3 { font-size: 14px; font-weight: 600; margin: 20px 0 8px; }
  .subtitle { font-size: 11px; color: #666; margin-bottom: 20px; }
  .patient-info { font-size: 13px; margin-bottom: 16px; color: #333; }
  .appt-detail { font-size: 13px; margin-bottom: 12px; }
  .appt-notes { font-size: 12px; color: #555; margin: 4px 0 8px; }
  .summary { display: flex; gap: 32px; margin-bottom: 20px; }
  .summary-item { display: flex; flex-direction: column; }
  .summary-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; }
  .summary-value { font-size: 18px; font-weight: 600; }
  .summary-value.paid { color: #2e7d32; }
  .summary-value.debt { color: #c62828; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #f5f5f5; text-align: left; padding: 8px 10px; border-bottom: 2px solid #ddd;
       font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; color: #555; }
  td { padding: 7px 10px; border-bottom: 1px solid #eee; }
  tr:last-child td { border-bottom: none; }
  .num { text-align: right; }
  th.num { text-align: right; }
  .debt { color: #c62828; font-weight: 500; }
  tfoot td { border-top: 2px solid #ddd; font-weight: 600; padding-top: 10px; }
  .signature-area { margin-top: 40px; padding-top: 16px; }
  .sig-line { width: 250px; border-top: 1px solid #999; padding-top: 6px; font-size: 11px; color: #666; text-align: center; }
${letterheadStyles()}
</style>
</head><body>
${letterheadHtml(this.clinicInfoSvc.clinicInfo(), this.logoBase64())}
<h1>Извештај за средба — ${r.firstName} ${r.lastName}</h1>
<p class="subtitle">Печатено: ${fmtNow}</p>
<p class="patient-info">${patientInfo}</p>
<div class="appt-detail">
  <strong>Датум:</strong> ${fmtDate(r.startsAt)} &nbsp;
  <strong>Време:</strong> ${fmtTime(r.startsAt)} — ${fmtTime(r.endsAt)} (${dur} мин) &nbsp;
  <strong>Статус:</strong> ${sl(r.status)}
</div>
${r.notes ? `<p class="appt-notes"><strong>Белешки:</strong> ${r.notes}</p>` : ''}
<div class="summary">
  <div class="summary-item"><span class="summary-label">Вкупно</span><span class="summary-value">${fmt(r.totalCharged)} ден</span></div>
  <div class="summary-item"><span class="summary-label">Платено</span><span class="summary-value paid">${fmt(r.totalPaid)} ден</span></div>
  <div class="summary-item"><span class="summary-label">Долг</span><span class="summary-value${r.totalOutstanding > 0 ? ' debt' : ''}">${fmt(r.totalOutstanding)} ден</span></div>
</div>
${r.interventions.length > 0 ? `
<table>
  <thead><tr><th>Интервенција</th><th>Заби</th><th class="num">Цена</th><th class="num">Платено</th><th class="num">Долг</th><th>Белешка</th></tr></thead>
  <tbody>${intRows}</tbody>
  <tfoot><tr><td colspan="2"><strong>Вкупно</strong></td>
    <td class="num"><strong>${fmt(r.totalCharged)}</strong></td>
    <td class="num"><strong>${fmt(r.totalPaid)}</strong></td>
    <td class="num${r.totalOutstanding > 0 ? ' debt' : ''}"><strong>${fmt(r.totalOutstanding)}</strong></td>
    <td></td></tr></tfoot>
</table>` : '<p>Нема интервенции</p>'}
<div class="signature-area">
  <div class="sig-line">Потпис и печат на ординација</div>
</div>
<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script>
</body></html>`;

      const w = window.open('', '_blank');
      if (w) {
        w.document.write(html);
        w.document.close();
      }
    });
  }

  goBack(): void {
    const p = this.patient();
    if (p) this.router.navigate(['/patients', p.id]);
    else this.router.navigate(['/calendar']);
  }

  catalogDisplayFn(item: CatalogItem | string | null): string {
    if (!item) return '';
    return typeof item === 'string' ? item : item.name;
  }

  getInterventionColor(idx: number): string {
    return INTERVENTION_COLORS[idx % INTERVENTION_COLORS.length];
  }
}