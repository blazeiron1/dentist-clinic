import {
  Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, ElementRef, ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { forkJoin, finalize } from 'rxjs';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { PatientService } from '../../../core/services/patient.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { InterventionService } from '../../../core/services/intervention.service';
import { DocumentService } from '../../../core/services/document.service';
import {
  Patient, PatientCreate, Appointment, Intervention,
  Allergy, Condition, Medication, PatientDocument,
} from '../../../core/models';
import { STATUS_LABELS, STATUS_MAT_COLORS } from '../../../core/constants';
import { ClinicInfoService } from '../../../core/services/clinic-info.service';
import { letterheadHtml, letterheadStyles, fetchLogoAsBase64 } from '../../../core/print-letterhead';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [
    FormsModule, DatePipe, DecimalPipe, RouterLink,
    MatTabsModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatChipsModule, MatTableModule, MatTooltipModule,
    MatDividerModule, MatCardModule, MatMenuModule, MatProgressBarModule, MatDatepickerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-detail.component.html',
  styleUrl: './patient-detail.component.scss',
})
export class PatientDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private patientSvc = inject(PatientService);
  private apptSvc = inject(AppointmentService);
  private intSvc = inject(InterventionService);
  private docSvc = inject(DocumentService);
  private clinicInfoSvc = inject(ClinicInfoService);
  private logoBase64 = signal<string | undefined>(undefined);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  patient = signal<Patient | null>(null);
  editMode = signal(false);
  editForm = signal<Partial<Patient>>({});
  editDob = signal<Date | null>(null);
  today = new Date();
  editErrors = signal<Record<string, string>>({});

  allergies = signal<Allergy[]>([]);
  conditions = signal<Condition[]>([]);
  medications = signal<Medication[]>([]);
  appointments = signal<Appointment[]>([]);
  allInterventions = signal<Intervention[]>([]);
  documents = signal<PatientDocument[]>([]);
  uploading = signal(false);
  dragOver = signal(false);

  newAllergy = signal('');
  newCondition = signal('');
  newMedication = signal('');

  totalCharged = computed(() => this.allInterventions().reduce((s, i) => s + i.price, 0));
  totalPaid = computed(() => this.allInterventions().reduce((s, i) => s + i.paidAmount, 0));
  totalOutstanding = computed(() => this.totalCharged() - this.totalPaid());

  upcomingAppts = computed(() => {
    const now = new Date().toISOString();
    return this.appointments().filter(a => a.startsAt > now && a.status === 'scheduled');
  });

  pastAppts = computed(() => {
    const now = new Date().toISOString();
    return this.appointments().filter(a => a.startsAt <= now || a.status !== 'scheduled');
  });

  financialCols = ['date', 'intervention', 'teeth', 'price', 'paid', 'outstanding'];
  printDate = new Date();

  statusLabel = (s: string) => STATUS_LABELS[s] ?? s;
  statusColor = (s: string) => STATUS_MAT_COLORS[s] ?? '';

  durationMinutes(a: Appointment): number {
    return Math.round((new Date(a.endsAt).getTime() - new Date(a.startsAt).getTime()) / 60000);
  }

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.patientSvc.getById(id).subscribe({
      next: p => {
        this.patient.set(p);
        this.loadMedicalData(p.id);
        this.loadAppointments(p.id);
        this.loadDocuments(p.id);
        fetchLogoAsBase64(this.clinicInfoSvc.clinicInfo().logoUrl).then(b64 => this.logoBase64.set(b64));
      },
      error: () => this.router.navigate(['/patients']),
    });
  }

  private loadMedicalData(patientId: number): void {
    this.patientSvc.getAllergies(patientId).subscribe(a => this.allergies.set(a));
    this.patientSvc.getConditions(patientId).subscribe(c => this.conditions.set(c));
    this.patientSvc.getMedications(patientId).subscribe(m => this.medications.set(m));
  }

  private loadAppointments(patientId: number): void {
    const far = new Date('2000-01-01');
    const future = new Date('2099-12-31');
    this.apptSvc.findByRange(far, future, patientId).subscribe(appts => {
      const sorted = appts.sort((a, b) => b.startsAt.localeCompare(a.startsAt));
      this.appointments.set(sorted);
      this.loadAllInterventions(sorted);
    });
  }

  private loadAllInterventions(appts: Appointment[]): void {
    if (appts.length === 0) { this.allInterventions.set([]); return; }
    const reqs = appts.map(a => this.intSvc.getByAppointment(a.id));
    forkJoin(reqs).subscribe(results => {
      this.allInterventions.set(results.flat());
    });
  }

  private loadDocuments(patientId: number): void {
    this.docSvc.list(patientId).subscribe(docs => this.documents.set(docs));
  }

  printFinancials(): void {
    const p = this.patient()!;
    const interventions = this.allInterventions();
    const fmt = (n: number) => n.toLocaleString('mk-MK');
    const fmtDate = (iso?: string) => {
      if (!iso) return '—';
      const d = new Date(iso);
      return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
    };

    const rows = interventions.map(i => `
      <tr>
        <td>${fmtDate(i.performedAt)}</td>
        <td>${i.name}</td>
        <td>${i.teeth.join(', ') || '—'}</td>
        <td class="num">${fmt(i.price)}</td>
        <td class="num">${fmt(i.paidAmount)}</td>
        <td class="num${i.outstanding > 0 ? ' debt' : ''}">${fmt(i.outstanding)}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Финансии — ${p.firstName} ${p.lastName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #222; }
  h1 { font-size: 18px; font-weight: 600; margin-bottom: 2px; }
  .subtitle { font-size: 12px; color: #666; margin-bottom: 20px; }
  .summary { display: flex; gap: 24px; margin-bottom: 20px; }
  .summary-item { display: flex; flex-direction: column; }
  .summary-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; }
  .summary-value { font-size: 18px; font-weight: 600; }
  .summary-value.paid { color: #2e7d32; }
  .summary-value.debt { color: #c62828; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f5f5f5; text-align: left; padding: 8px 10px; border-bottom: 2px solid #ddd;
       font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; color: #555; }
  td { padding: 7px 10px; border-bottom: 1px solid #eee; }
  tr:last-child td { border-bottom: none; }
  .num { text-align: right; }
  .debt { color: #c62828; font-weight: 500; }
  tfoot td { border-top: 2px solid #ddd; font-weight: 600; padding-top: 10px; }
${letterheadStyles()}
</style>
</head><body>
${letterheadHtml(this.clinicInfoSvc.clinicInfo(), this.logoBase64())}
<h1>Финансиски извештај — ${p.firstName} ${p.lastName}</h1>
<p class="subtitle">${p.phone || ''} ${p.email ? '· ' + p.email : ''} · Печатено: ${fmtDate(new Date().toISOString())}</p>

<div class="summary">
  <div class="summary-item">
    <span class="summary-label">Вкупно наплатено</span>
    <span class="summary-value">${fmt(this.totalCharged())} ден</span>
  </div>
  <div class="summary-item">
    <span class="summary-label">Платено</span>
    <span class="summary-value paid">${fmt(this.totalPaid())} ден</span>
  </div>
  <div class="summary-item">
    <span class="summary-label">Долг</span>
    <span class="summary-value${this.totalOutstanding() > 0 ? ' debt' : ''}">${fmt(this.totalOutstanding())} ден</span>
  </div>
</div>

${interventions.length > 0 ? `
<table>
  <thead>
    <tr>
      <th>Датум</th>
      <th>Интервенција</th>
      <th>Заби</th>
      <th class="num">Цена</th>
      <th class="num">Платено</th>
      <th class="num">Долг</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
  <tfoot>
    <tr>
      <td colspan="3">Вкупно</td>
      <td class="num">${fmt(this.totalCharged())}</td>
      <td class="num">${fmt(this.totalPaid())}</td>
      <td class="num${this.totalOutstanding() > 0 ? ' debt' : ''}">${fmt(this.totalOutstanding())}</td>
    </tr>
  </tfoot>
</table>` : '<p>Нема интервенции</p>'}
<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  }

  // ── Edit ────────────────────────────────────────────────────────────────────
  startEdit(): void {
    const p = this.patient()!;
    this.editForm.set({ ...p });
    this.editDob.set(p.dateOfBirth ? new Date(p.dateOfBirth) : null);
    this.editErrors.set({});
    this.editMode.set(true);
  }

  private validateEdit(): boolean {
    const f = this.editForm();
    const errors: Record<string, string> = {};
    if (!f.firstName?.trim()) errors['firstName'] = 'Името е задолжително';
    else if (f.firstName.trim().length < 2) errors['firstName'] = 'Минимум 2 карактери';
    if (!f.lastName?.trim()) errors['lastName'] = 'Презимето е задолжително';
    else if (f.lastName.trim().length < 2) errors['lastName'] = 'Минимум 2 карактери';
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errors['email'] = 'Невалидна е-пошта';
    if (f.embg && !/^\d{13}$/.test(f.embg)) errors['embg'] = 'ЕМБГ мора да содржи точно 13 цифри';
    if (f.phone && !/^[0-9+\-\s()]{6,20}$/.test(f.phone)) errors['phone'] = 'Невалиден формат на телефон';
    this.editErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  private formatDate(d: Date | null): string | undefined {
    if (!d) return undefined;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  saveEdit(): void {
    if (!this.validateEdit()) return;
    const p = this.patient()!;
    const f = this.editForm();
    const dto: PatientCreate = {
      firstName: f.firstName ?? p.firstName,
      lastName: f.lastName ?? p.lastName,
      phone: f.phone ?? p.phone,
      email: f.email,
      embg: f.embg,
      dateOfBirth: this.formatDate(this.editDob()),
      address: f.address,
      notes: f.notes,
    };
    this.patientSvc.update(p.id, dto).subscribe({
      next: updated => {
        this.patient.set(updated);
        this.editMode.set(false);
      },
      error: (err: any) => {
        if (err.status === 409) {
          this.editErrors.set({ embg: err.error?.detail || 'Пациент со овој ЕМБГ веќе постои' });
        }
      },
    });
  }

  cancelEdit(): void { this.editMode.set(false); }

  updateForm(field: keyof Patient, value: string): void {
    this.editForm.update(f => ({ ...f, [field]: value }));
  }

  updateDob(value: Date | null): void {
    this.editDob.set(value);
  }

  // ── Medical ─────────────────────────────────────────────────────────────────
  addAllergy(): void {
    const v = this.newAllergy().trim();
    if (!v) return;
    if (this.allergies().some(a => a.name.toLowerCase() === v.toLowerCase())) return;
    const p = this.patient()!;
    this.patientSvc.addAllergy(p.id, { name: v }).subscribe(a => {
      this.allergies.update(list => [...list, a]);
      this.newAllergy.set('');
    });
  }

  removeAllergy(a: Allergy): void {
    const p = this.patient()!;
    this.patientSvc.removeAllergy(p.id, a.id).subscribe(() => {
      this.allergies.update(list => list.filter(x => x.id !== a.id));
    });
  }

  addCondition(): void {
    const v = this.newCondition().trim();
    if (!v) return;
    if (this.conditions().some(c => c.name.toLowerCase() === v.toLowerCase())) return;
    const p = this.patient()!;
    this.patientSvc.addCondition(p.id, { name: v }).subscribe(c => {
      this.conditions.update(list => [...list, c]);
      this.newCondition.set('');
    });
  }

  removeCondition(c: Condition): void {
    const p = this.patient()!;
    this.patientSvc.removeCondition(p.id, c.id).subscribe(() => {
      this.conditions.update(list => list.filter(x => x.id !== c.id));
    });
  }

  addMedication(): void {
    const v = this.newMedication().trim();
    if (!v) return;
    if (this.medications().some(m => m.name.toLowerCase() === v.toLowerCase())) return;
    const p = this.patient()!;
    this.patientSvc.addMedication(p.id, { name: v }).subscribe(m => {
      this.medications.update(list => [...list, m]);
      this.newMedication.set('');
    });
  }

  removeMedication(m: Medication): void {
    const p = this.patient()!;
    this.patientSvc.removeMedication(p.id, m.id).subscribe(() => {
      this.medications.update(list => list.filter(x => x.id !== m.id));
    });
  }

  // ── Documents ───────────────────────────────────────────────────────────────
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.uploadFiles(files);
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.uploadFiles(input.files);
      input.value = '';
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  private uploadFiles(files: FileList): void {
    const p = this.patient()!;
    this.uploading.set(true);
    const uploads = Array.from(files).map(file => this.docSvc.upload(p.id, file));
    forkJoin(uploads).pipe(
      finalize(() => this.uploading.set(false)),
    ).subscribe({
      next: docs => {
        this.documents.update(list => [...docs, ...list]);
      },
    });
  }

  downloadDoc(doc: PatientDocument): void {
    this.docSvc.download(doc.id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  deleteDoc(doc: PatientDocument): void {
    this.docSvc.delete(doc.id).subscribe(() => {
      this.documents.update(list => list.filter(d => d.id !== doc.id));
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  docIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('pdf')) return 'picture_as_pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'description';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'table_chart';
    return 'attach_file';
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  interventionsForAppt(apptId: number): Intervention[] {
    return this.allInterventions().filter(i => i.appointmentId === apptId);
  }

  goBack(): void { this.router.navigate(['/patients']); }
}
