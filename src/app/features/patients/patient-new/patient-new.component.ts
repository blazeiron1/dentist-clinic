import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { PatientService } from '../../../core/services/patient.service';

@Component({
  selector: 'app-patient-new',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patient-new.component.html',
})
export class PatientNewComponent {
  private patientSvc = inject(PatientService);
  private router = inject(Router);

  form = signal({
    firstName: '', lastName: '', phone: '', email: '', embg: '',
    dateOfBirth: '', address: '', notes: '',
  });

  update(field: string, value: string): void {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  save(): void {
    const f = this.form();
    if (!f.firstName || !f.lastName || !f.phone) return;
    const patient = this.patientSvc.add({
      ...f, allergies: [], conditions: [], medications: [],
    });
    this.router.navigate(['/patients', patient.id]);
  }

  cancel(): void {
    this.router.navigate(['/patients']);
  }
}
