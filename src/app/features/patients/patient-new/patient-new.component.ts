import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PatientService } from '../../../core/services/patient.service';

@Component({
  selector: 'app-patient-new',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatCardModule, MatDividerModule, MatDatepickerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-new.component.html',
})
export class PatientNewComponent {
  private patientSvc = inject(PatientService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{6,20}$/)]],
    email: ['', Validators.email],
    embg: ['', Validators.pattern(/^\d{13}$/)],
    dateOfBirth: [null as Date | null],
    address: [''],
    notes: [''],
  });

  today = new Date();

  private formatDate(d: Date | null): string | undefined {
    if (!d) return undefined;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const f = this.form.getRawValue();
    this.patientSvc.create({
      firstName: f.firstName!,
      lastName: f.lastName!,
      phone: f.phone || undefined,
      email: f.email || undefined,
      embg: f.embg || undefined,
      dateOfBirth: this.formatDate(f.dateOfBirth),
      address: f.address || undefined,
      notes: f.notes || undefined,
    }).subscribe({
      next: patient => {
        this.router.navigate(['/patients', patient.id]);
      },
      error: err => {
        if (err.status === 409) {
          this.snackBar.open(err.error?.detail || 'Пациент со овој ЕМБГ веќе постои', '', { duration: 5000 });
        } else {
          this.snackBar.open('Грешка при зачувување', '', { duration: 3000 });
        }
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/patients']);
  }
}
