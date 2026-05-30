import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { DecimalPipe } from '@angular/common';
import { PAYMENT_METHODS } from '../../../core/constants';

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [FormsModule, DecimalPipe, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
<h2 mat-dialog-title>Додади уплата</h2>
<mat-dialog-content>
  <mat-form-field appearance="outline" class="full">
    <mat-label>Износ (ден)</mat-label>
    <input matInput type="number" [ngModel]="amount()" (ngModelChange)="amount.set($event)" />
    <span matTextSuffix>ден</span>
  </mat-form-field>
  <mat-form-field appearance="outline" class="full">
    <mat-label>Начин на плаќање</mat-label>
    <mat-select [ngModel]="method()" (ngModelChange)="method.set($event)">
      @for (m of paymentMethods; track m.key) {
        <mat-option [value]="m.key">{{ m.label }}</mat-option>
      }
    </mat-select>
  </mat-form-field>
  <p class="hint">Максимален износ: {{ data.outstanding | number }} ден</p>
</mat-dialog-content>
<mat-dialog-actions align="end">
  <button mat-button mat-dialog-close>Откажи</button>
  <button mat-flat-button color="primary" (click)="save()" [disabled]="!amount() || amount() <= 0">Потврди</button>
</mat-dialog-actions>
  `,
  styles: ['.full { width: 100%; } mat-dialog-content { display: flex; flex-direction: column; gap: 4px; padding-top: 8px !important; } .hint { font-size: 12px; color: #777; margin: 0; }'],
})
export class PaymentDialogComponent {
  data = inject(MAT_DIALOG_DATA) as { outstanding: number };
  private dialogRef = inject(MatDialogRef<PaymentDialogComponent>);

  readonly paymentMethods = PAYMENT_METHODS;
  amount = signal<number>(this.data.outstanding);
  method = signal<string>('cash');

  save(): void {
    this.dialogRef.close({ amount: Math.min(this.amount(), this.data.outstanding), method: this.method() });
  }
}
