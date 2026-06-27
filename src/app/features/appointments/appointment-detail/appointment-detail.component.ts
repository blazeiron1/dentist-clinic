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
import { Appointment, AppointmentStatus, CatalogItem, Intervention, Patient } from '../../../core/models';
import { STATUS_LABELS, INTERVENTION_COLORS, APPOINTMENT_STATUSES } from '../../../core/constants';
import { ToothChartComponent } from '../../../shared/components/tooth-chart';
import { ToothPickerDialogComponent } from './tooth-picker-dialog.component';
import { PaymentDialogComponent } from './payment-dialog.component';

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
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

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
    this.intSvc.getByAppointment(appointmentId).subscribe(list => {
      this.interventions.set(list);
    });
  }

  setStatus(status: AppointmentStatus): void {
    if (status === 'cancelled' || status === 'no-show') {
      const label = status === 'cancelled' ? 'откажана' : 'не дојде';
      const confirmed = confirm(`Дали сте сигурни дека сакате да го промените статусот во "${label}"?`);
      if (!confirmed) return;
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
      const confirmed = confirm(
        `Цената ќе се промени од ${d.price} на ${item.lastPrice} ден. Продолжи?`
      );
      if (!confirmed) {
        this.draft.update(d => d ? { ...d, name: item.name } : d);
        return;
      }
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
    this.intSvc.delete(id).subscribe(() => {
      this.interventions.update(list => list.filter(i => i.id !== id));
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