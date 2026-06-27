import {
  Component, inject, signal, OnInit, ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PatientService } from '../../../core/services/patient.service';
import { Patient } from '../../../core/models';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [
    FormsModule, DatePipe,
    MatTableModule, MatInputModule, MatFormFieldModule, MatButtonModule,
    MatIconModule, MatTooltipModule, MatPaginatorModule, MatProgressBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.scss',
})
export class PatientListComponent implements OnInit {
  private patientSvc = inject(PatientService);
  private router = inject(Router);

  query = signal('');
  page = signal(0);
  pageSize = signal(10);

  loading = signal(true);
  displayedPatients = signal<Patient[]>([]);
  totalCount = signal(0);

  columns = ['avatar', 'name', 'phone', 'embg', 'created', 'arrow'];

  ngOnInit(): void {
    this.loadPatients();
  }

  onSearch(q: string): void {
    this.query.set(q);
    this.page.set(0);
    this.loadPatients();
  }

  onPage(e: PageEvent): void {
    this.page.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.loadPatients();
  }

  goToPatient(p: Patient): void {
    this.router.navigate(['/patients', p.id]);
  }

  newPatient(): void {
    this.router.navigate(['/patients/new']);
  }

  private loadPatients(): void {
    this.loading.set(true);
    this.patientSvc.search(this.query() || undefined, this.page(), this.pageSize()).subscribe(page => {
      this.displayedPatients.set(page.content);
      this.totalCount.set(page.totalElements);
      this.loading.set(false);
    });
  }
}
