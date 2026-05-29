import {
  Component, inject, signal, computed, OnInit, ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
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
import { Patient, Appointment, Intervention } from '../../../core/models';

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Закажана', completed: 'Завршена',
  cancelled: 'Откажана', 'no-show': 'Не дојде',
};
const STATUS_COLORS: Record<string, string> = {
  scheduled: 'primary', completed: 'accent', cancelled: '', 'no-show': 'warn',
};

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

  newAllergy = signal('');
  newCondition = signal('');
  newMedication = signal('');

  appointments = computed(() => {
    const p = this.patient();
    if (!p) return [];
    return this.apptSvc.byPatient(p.id);
  });

  allInterventions = computed<Intervention[]>(() => {
    const p = this.patient();
    if (!p) return [];
    const apptIds = this.appointments().map(a => a.id);
    return this.intSvc.byPatient(p.id, apptIds);
  });

  totalCharged = computed(() => this.allInterventions().reduce((s, i) => s + i.price, 0));
  totalPaid = computed(() => this.allInterventions().reduce((s, i) => s + i.paidAmount, 0));
  totalOutstanding = computed(() => this.totalCharged() - this.totalPaid());

  financialCols = ['date', 'intervention', 'teeth', 'price', 'paid', 'outstanding'];

  statusLabel = (s: string) => STATUS_LABELS[s] ?? s;
  statusColor = (s: string) => STATUS_COLORS[s] ?? '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    const p = this.patientSvc.getById(id);
    if (!p) { this.router.navigate(['/patients']); return; }
    this.patient.set(p);
  }

  startEdit(): void {
    const p = this.patient()!;
    this.editForm.set({ ...p });
    this.editMode.set(true);
  }

  saveEdit(): void {
    const p = this.patient()!;
    this.patientSvc.update(p.id, this.editForm());
    this.patient.set(this.patientSvc.getById(p.id)!);
    this.editMode.set(false);
  }

  cancelEdit(): void { this.editMode.set(false); }

  updateForm(field: keyof Patient, value: string): void {
    this.editForm.update(f => ({ ...f, [field]: value }));
  }

  addAllergy(): void {
    const v = this.newAllergy().trim();
    if (!v) return;
    const p = this.patient()!;
    this.patientSvc.update(p.id, { allergies: [...p.allergies, v] });
    this.patient.set(this.patientSvc.getById(p.id)!);
    this.newAllergy.set('');
  }

  removeAllergy(a: string): void {
    const p = this.patient()!;
    this.patientSvc.update(p.id, { allergies: p.allergies.filter(x => x !== a) });
    this.patient.set(this.patientSvc.getById(p.id)!);
  }

  addCondition(): void {
    const v = this.newCondition().trim();
    if (!v) return;
    const p = this.patient()!;
    this.patientSvc.update(p.id, { conditions: [...p.conditions, v] });
    this.patient.set(this.patientSvc.getById(p.id)!);
    this.newCondition.set('');
  }

  removeCondition(c: string): void {
    const p = this.patient()!;
    this.patientSvc.update(p.id, { conditions: p.conditions.filter(x => x !== c) });
    this.patient.set(this.patientSvc.getById(p.id)!);
  }

  addMedication(): void {
    const v = this.newMedication().trim();
    if (!v) return;
    const p = this.patient()!;
    this.patientSvc.update(p.id, { medications: [...p.medications, v] });
    this.patient.set(this.patientSvc.getById(p.id)!);
    this.newMedication.set('');
  }

  removeMedication(m: string): void {
    const p = this.patient()!;
    this.patientSvc.update(p.id, { medications: p.medications.filter(x => x !== m) });
    this.patient.set(this.patientSvc.getById(p.id)!);
  }

  interventionsForAppt(apptId: string): Intervention[] {
    return this.intSvc.byAppointment(apptId);
  }

  goBack(): void { this.router.navigate(['/patients']); }
}
