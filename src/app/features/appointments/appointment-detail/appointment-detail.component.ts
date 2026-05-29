import {
  Component, inject, signal, computed, OnInit, ChangeDetectionStrategy,
} from '@angular/core';
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
import { AppointmentService } from '../../../core/services/appointment.service';
import { PatientService } from '../../../core/services/patient.service';
import { InterventionService } from '../../../core/services/intervention.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { PaymentService } from '../../../core/services/payment.service';
import { Appointment, AppointmentStatus, CatalogItem, Intervention, Patient } from '../../../core/models';
import { ToothChartComponent } from '../../../shared/components/tooth-chart';
import { ToothPickerDialogComponent } from './tooth-picker-dialog.component';
import { PaymentDialogComponent } from './payment-dialog.component';

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Закажана', completed: 'Завршена',
  cancelled: 'Откажана', 'no-show': 'Не дојде',
};

export const INTERVENTION_COLORS = [
  '#e53935', '#8e24aa', '#1e88e5', '#00897b',
  '#f4511e', '#3949ab', '#039be5', '#43a047',
];

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [
    FormsModule, DatePipe, DecimalPipe, RouterLink,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatAutocompleteModule, MatTooltipModule,
    MatDividerModule, MatChipsModule, MatMenuModule,
    ToothChartComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './appointment-detail.component.html',
  styleUrl: './appointment-detail.component.scss',
})
export class AppointmentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apptSvc = inject(AppointmentService);
  private patientSvc = inject(PatientService);
  private intSvc = inject(InterventionService);
  private catalogSvc = inject(CatalogService);
  private paySvc = inject(PaymentService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  appointment = signal<Appointment | null>(null);
  patient = signal<Patient | null>(null);

  interventions = computed(() => {
    const a = this.appointment();
    if (!a) return [];
    return this.intSvc.byAppointment(a.id);
  });

  // Map of intervention index → catalog suggestions
  catalogSuggestions = signal<CatalogItem[]>([]);

  // For the tooth chart: map tooth → intervention color
  interventionTeethMap = computed(() => {
    const map = new Map<number, string>();
    this.interventions().forEach((int, idx) => {
      const color = INTERVENTION_COLORS[idx % INTERVENTION_COLORS.length];
      int.teeth.forEach(t => map.set(t, color));
    });
    return map;
  });

  totalCharged = computed(() => this.interventions().reduce((s, i) => s + i.price, 0));
  totalPaid = computed(() => this.interventions().reduce((s, i) => s + i.paidAmount, 0));

  statusLabel = (s: string) => STATUS_LABELS[s] ?? s;

  readonly statusOptions: AppointmentStatus[] = ['scheduled', 'completed', 'cancelled', 'no-show'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    const a = this.apptSvc.getById(id);
    if (!a) { this.router.navigate(['/calendar']); return; }
    this.appointment.set(a);
    this.patient.set(this.patientSvc.getById(a.patientId) ?? null);
  }

  setStatus(status: AppointmentStatus): void {
    const a = this.appointment()!;
    this.apptSvc.updateStatus(a.id, status);
    this.appointment.set(this.apptSvc.getById(a.id)!);
  }

  addIntervention(): void {
    const a = this.appointment()!;
    this.intSvc.add({ appointmentId: a.id, name: '', teeth: [], price: 0, paidAmount: 0 });
  }

  removeIntervention(id: string): void {
    this.intSvc.remove(id);
  }

  onNameQuery(interventionId: string, q: string): void {
    this.catalogSuggestions.set(this.catalogSvc.search(q));
    this.intSvc.update(interventionId, { name: q });
  }

  onCatalogSelect(interventionId: string, item: CatalogItem): void {
    this.intSvc.update(interventionId, {
      name: item.name,
      price: item.defaultPrice,
      catalogItemId: item.id,
    });
  }

  updatePrice(interventionId: string, value: string): void {
    const n = parseFloat(value);
    if (!isNaN(n)) this.intSvc.update(interventionId, { price: n });
  }

  openToothPicker(intervention: Intervention): void {
    const ref = this.dialog.open(ToothPickerDialogComponent, {
      width: '600px',
      data: { selected: [...intervention.teeth] },
    });
    ref.afterClosed().subscribe((teeth: number[] | undefined) => {
      if (teeth !== undefined) this.intSvc.update(intervention.id, { teeth });
    });
  }

  openPayment(intervention: Intervention): void {
    const ref = this.dialog.open(PaymentDialogComponent, {
      width: '380px',
      data: { outstanding: intervention.price - intervention.paidAmount },
    });
    ref.afterClosed().subscribe((result: { amount: number; method: string } | undefined) => {
      if (!result) return;
      this.paySvc.add(intervention.id, result.amount, result.method as any);
      this.intSvc.addPayment(intervention.id, result.amount);
      this.snackBar.open('Уплатата е евидентирана', 'OK', { duration: 2500 });
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
