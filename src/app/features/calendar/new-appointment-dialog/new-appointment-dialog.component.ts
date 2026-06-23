import {
  Component, inject, signal, OnInit, ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { PatientService } from '../../../core/services/patient.service';
import { Patient } from '../../../core/models';
import { DURATION_OPTIONS } from '../../../core/constants';

@Component({
  selector: 'app-new-appointment-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatAutocompleteModule, MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<h2 mat-dialog-title>Нова средба</h2>
<mat-dialog-content>
  <mat-form-field appearance="outline" class="full">
    <mat-label>Пациент</mat-label>
    <input matInput [ngModel]="patientQuery()"
           (ngModelChange)="onPatientQuery($event)"
           [matAutocomplete]="patientAc"
           placeholder="Име и Презиме" />
    <mat-autocomplete #patientAc [displayWith]="displayPatient"
                      (optionSelected)="selectedPatient.set($event.option.value)">
      @for (p of filteredPatients(); track p.id) {
        <mat-option [value]="p">{{ p.firstName }} {{ p.lastName }} — {{ p.phone }}</mat-option>
      }
    </mat-autocomplete>
  </mat-form-field>

  <mat-form-field appearance="outline" class="full">
    <mat-label>Датум и час</mat-label>
    <input matInput type="datetime-local" [ngModel]="dateTimeStr()"
           (ngModelChange)="dateTimeStr.set($event)" />
  </mat-form-field>

  <mat-form-field appearance="outline" class="full">
    <mat-label>Времетраење (мин)</mat-label>
    <mat-select [ngModel]="duration()" (ngModelChange)="duration.set($event)">
      @for (d of durations; track d) {
        <mat-option [value]="d">{{ d }} мин</mat-option>
      }
    </mat-select>
  </mat-form-field>

  <mat-form-field appearance="outline" class="full">
    <mat-label>Забелешки</mat-label>
    <textarea matInput rows="3" [ngModel]="notes()" (ngModelChange)="notes.set($event)"></textarea>
  </mat-form-field>
</mat-dialog-content>
<mat-dialog-actions align="end">
  <button mat-button mat-dialog-close>Откажи</button>
  <button mat-flat-button color="primary" (click)="save()" [disabled]="!selectedPatient()">Зачувај</button>
</mat-dialog-actions>
  `,
  styles: ['.full { width: 100%; } mat-dialog-content { display: flex; flex-direction: column; gap: 4px; padding-top: 8px !important; }'],
})
export class NewAppointmentDialogComponent implements OnInit {
  private patientSvc = inject(PatientService);
  private dialogRef = inject(MatDialogRef<NewAppointmentDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as { dateTime?: Date };

  patientQuery = signal('');
  selectedPatient = signal<Patient | null>(null);
  filteredPatients = signal<Patient[]>([]);
  dateTimeStr = signal('');
  duration = signal(60);
  notes = signal('');

  readonly durations = DURATION_OPTIONS;

  ngOnInit(): void {
    if (this.data?.dateTime) {
      const d = this.data.dateTime;
      const pad = (n: number) => n.toString().padStart(2, '0');
      this.dateTimeStr.set(
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      );
    }
    this.patientSvc.search(undefined, 0, 10).subscribe(page => {
      this.filteredPatients.set(page.content);
    });
  }

  onPatientQuery(q: string): void {
    this.patientQuery.set(q);
    if (typeof q === 'string') {
      this.selectedPatient.set(null);
      this.patientSvc.search(q || undefined, 0, 10).subscribe(page => {
        this.filteredPatients.set(page.content);
      });
    }
  }

  displayPatient(p: Patient | null): string {
    return p ? `${p.firstName} ${p.lastName}` : '';
  }

  save(): void {
    const patient = this.selectedPatient();
    if (!patient) return;
    const startsAt = new Date(this.dateTimeStr()).toISOString();
    const endsAt = new Date(new Date(this.dateTimeStr()).getTime() + this.duration() * 60000).toISOString();
    this.dialogRef.close({
      patientId: patient.id,
      startsAt,
      endsAt,
      notes: this.notes() || undefined,
    });
  }
}
