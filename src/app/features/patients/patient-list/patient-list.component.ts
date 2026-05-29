import {
  Component, inject, signal, computed, OnInit, ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatBadgeModule } from '@angular/material/badge';
import { PatientService } from '../../../core/services/patient.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { InterventionService } from '../../../core/services/intervention.service';
import { Patient } from '../../../core/models';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [
    FormsModule, DatePipe, DecimalPipe,
    MatTableModule, MatInputModule, MatFormFieldModule, MatButtonModule,
    MatIconModule, MatTooltipModule, MatPaginatorModule, MatBadgeModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.scss',
})
export class PatientListComponent {
  private patientSvc = inject(PatientService);
  private apptSvc = inject(AppointmentService);
  private intSvc = inject(InterventionService);
  private router = inject(Router);

  query = signal('');
  page = signal(0);
  pageSize = signal(10);

  private allFiltered = computed(() => this.patientSvc.search(this.query()));

  displayedPatients = computed(() => {
    const all = this.allFiltered();
    const start = this.page() * this.pageSize();
    return all.slice(start, start + this.pageSize());
  });

  totalCount = computed(() => this.allFiltered().length);

  columns = ['name', 'phone', 'embg', 'lastVisit', 'balance', 'actions'];

  lastVisit(patientId: string): string | null {
    const appts = this.apptSvc.byPatient(patientId).filter(a => a.status === 'completed');
    return appts.length ? appts[0].dateTime : null;
  }

  balance(patientId: string): number {
    const apptIds = this.apptSvc.byPatient(patientId).map(a => a.id);
    const interventions = this.intSvc.byPatient(patientId, apptIds);
    return interventions.reduce((s, i) => s + (i.price - i.paidAmount), 0);
  }

  onSearch(q: string): void {
    this.query.set(q);
    this.page.set(0);
  }

  onPage(e: PageEvent): void {
    this.page.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
  }

  goToPatient(p: Patient): void {
    this.router.navigate(['/patients', p.id]);
  }

  newPatient(): void {
    this.router.navigate(['/patients/new']);
  }
}
