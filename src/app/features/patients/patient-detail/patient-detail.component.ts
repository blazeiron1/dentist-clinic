import {
  Component, inject, signal, computed, OnInit, ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { PatientService } from '../../../core/services/patient.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { InterventionService } from '../../../core/services/intervention.service';
import { Patient, PatientCreate, Appointment, Intervention, Allergy, Condition, Medication } from '../../../core/models';
import { STATUS_LABELS, STATUS_MAT_COLORS } from '../../../core/constants';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [
    FormsModule, DatePipe, DecimalPipe, RouterLink,
    MatTabsModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatChipsModule, MatTableModule, MatTooltipModule,
    MatBadgeModule, MatDividerModule, MatCardModule,
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

  patient = signal<Patient | null>(null);
  editMode = signal(false);
  editForm = signal<Partial<Patient>>({});

  allergies = signal<Allergy[]>([]);
  conditions = signal<Condition[]>([]);
  medications = signal<Medication[]>([]);
  appointments = signal<Appointment[]>([]);
  allInterventions = signal<Intervention[]>([]);

  newAllergy = signal('');
  newCondition = signal('');
  newMedication = signal('');

  totalCharged = computed(() => this.allInterventions().reduce((s, i) => s + i.price, 0));
  totalPaid = computed(() => this.allInterventions().reduce((s, i) => s + i.paidAmount, 0));
  totalOutstanding = computed(() => this.totalCharged() - this.totalPaid());

  financialCols = ['date', 'intervention', 'teeth', 'price', 'paid', 'outstanding'];

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

  startEdit(): void {
    const p = this.patient()!;
    this.editForm.set({ ...p });
    this.editMode.set(true);
  }

  saveEdit(): void {
    const p = this.patient()!;
    const f = this.editForm();
    const dto: PatientCreate = {
      firstName: f.firstName ?? p.firstName,
      lastName: f.lastName ?? p.lastName,
      phone: f.phone ?? p.phone,
      email: f.email,
      embg: f.embg,
      dateOfBirth: f.dateOfBirth,
      address: f.address,
      notes: f.notes,
    };
    this.patientSvc.update(p.id, dto).subscribe(updated => {
      this.patient.set(updated);
      this.editMode.set(false);
    });
  }

  cancelEdit(): void { this.editMode.set(false); }

  updateForm(field: keyof Patient, value: string): void {
    this.editForm.update(f => ({ ...f, [field]: value }));
  }

  addAllergy(): void {
    const v = this.newAllergy().trim();
    if (!v) return;
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

  interventionsForAppt(apptId: number): Intervention[] {
    return this.allInterventions().filter(i => i.appointmentId === apptId);
  }

  goBack(): void { this.router.navigate(['/patients']); }
}
