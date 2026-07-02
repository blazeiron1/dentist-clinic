import { Component, inject, signal, computed } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

export interface DeletePatientDialogData {
  firstName: string;
  lastName: string;
  appointmentCount: number;
  interventionCount: number;
}

@Component({
  selector: 'app-delete-patient-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <h2 mat-dialog-title class="title">
      <mat-icon class="warn-icon">dangerous</mat-icon>
      Бришење на пациент
    </h2>
    <mat-dialog-content>
      <div class="warning-banner">
        <mat-icon>warning</mat-icon>
        <span>Пациентот и сите поврзани податоци ќе бидат <strong>трајно избришани</strong> од системот.</span>
      </div>

      <p class="patient-name">{{ data.firstName }} {{ data.lastName }}</p>

      @if (data.appointmentCount > 0 || data.interventionCount > 0) {
        <div class="impact-list">
          <span class="impact-title">Ова ќе ги засегне:</span>
          @if (data.appointmentCount > 0) {
            <span class="impact-item"><mat-icon>event</mat-icon>{{ data.appointmentCount }} средби</span>
          }
          @if (data.interventionCount > 0) {
            <span class="impact-item"><mat-icon>medical_services</mat-icon>{{ data.interventionCount }} интервенции</span>
          }
        </div>
      }

      <p class="confirm-instruction">
        За потврда, внесете го целото име на пациентот: <strong>{{ expectedText }}</strong>
      </p>
      <mat-form-field appearance="outline" class="confirm-field">
        <mat-label>Внесете име за потврда</mat-label>
        <input matInput [ngModel]="confirmText()" (ngModelChange)="confirmText.set($event)" autocomplete="off" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">Откажи</button>
      <button mat-flat-button color="warn" [disabled]="!canConfirm()" (click)="dialogRef.close(true)">
        <mat-icon>delete_forever</mat-icon>Избриши трајно
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #c62828;
    }
    .warn-icon {
      color: #c62828;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .warning-banner {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 14px 16px;
      background: #fff3e0;
      border: 1px solid #ffe0b2;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 13px;
      line-height: 1.5;
      color: #e65100;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        margin-top: 1px;
      }
    }
    .patient-name {
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 12px;
      text-align: center;
      padding: 10px;
      background: #fafafa;
      border-radius: 8px;
      border: 1px solid #eee;
    }
    .impact-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 16px;
      padding: 12px 16px;
      background: #fbe9e7;
      border-radius: 8px;
      font-size: 13px;
    }
    .impact-title {
      font-weight: 600;
      color: #bf360c;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .impact-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #c62828;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }
    .confirm-instruction {
      font-size: 13px;
      line-height: 1.5;
      margin: 0 0 12px;
      color: #555;
    }
    .confirm-field {
      width: 100%;
    }
  `],
})
export class DeletePatientDialogComponent {
  readonly dialogRef = inject(MatDialogRef<DeletePatientDialogComponent>);
  readonly data: DeletePatientDialogData = inject(MAT_DIALOG_DATA);

  readonly expectedText = `${this.data.firstName} ${this.data.lastName}`;
  readonly confirmText = signal('');
  readonly canConfirm = computed(() => this.confirmText().trim() === this.expectedText);
}
