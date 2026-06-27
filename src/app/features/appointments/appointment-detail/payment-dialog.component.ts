import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe } from '@angular/common';
import { PAYMENT_METHODS } from '../../../core/constants';

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [FormsModule, DecimalPipe, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatTooltipModule],
  template: `
<h2 mat-dialog-title>Додади уплата</h2>
<mat-dialog-content>
  <p class="outstanding-hint">Преостанат долг: <strong>{{ data.outstanding | number }} ден</strong></p>
  <mat-form-field appearance="outline" class="full">
    <mat-label>Износ (ден)</mat-label>
    <input matInput type="number" [ngModel]="amount()" (ngModelChange)="amount.set($event)"
           [min]="1" [max]="data.outstanding" />
    <span matTextSuffix>ден</span>
    @if (amountError()) {
      <mat-error>{{ amountError() }}</mat-error>
    }
  </mat-form-field>
  <mat-form-field appearance="outline" class="full">
    <mat-label>Начин на плаќање</mat-label>
    <mat-select [ngModel]="method()" (ngModelChange)="method.set($event)">
      @for (m of paymentMethods; track m.key) {
        <mat-option [value]="m.key" [matTooltip]="m.tooltip">{{ m.label }}</mat-option>
      }
    </mat-select>
  </mat-form-field>
</mat-dialog-content>
<mat-dialog-actions align="end">
  <button mat-button mat-dialog-close>Откажи</button>
  <button mat-flat-button color="primary" (click)="save()" [disabled]="!isValid()">Потврди</button>
</mat-dialog-actions>
  `,
  styles: [`.full { width: 100%; }
    mat-dialog-content { display: flex; flex-direction: column; gap: 4px; padding-top: 8px !important; }
    .outstanding-hint { font-size: 13px; color: #555; margin: 0 0 8px; }`],
})
export class PaymentDialogComponent {
  data = inject(MAT_DIALOG_DATA) as { outstanding: number };
  private dialogRef = inject(MatDialogRef<PaymentDialogComponent>);

  readonly paymentMethods = [
    { key: 'cash' as const, label: 'Готовина', tooltip: 'Плаќање во готово' },
    { key: 'card' as const, label: 'Картичка', tooltip: 'Плаќање со дебитна/кредитна картичка' },
    { key: 'transfer' as const, label: 'Трансфер', tooltip: 'Банкарски трансфер' },
  ];
  amount = signal<number | null>(null);
  method = signal<string>('cash');

  amountError = computed(() => {
    const a = this.amount();
    if (a === null || a === 0) return '';
    if (a < 0) return 'Износот не може да биде негативен';
    if (a > this.data.outstanding) return `Максимален износ: ${this.data.outstanding} ден`;
    return '';
  });

  isValid = computed(() => {
    const a = this.amount();
    return a !== null && a > 0 && a <= this.data.outstanding;
  });

  save(): void {
    if (!this.isValid()) return;
    this.dialogRef.close({ amount: this.amount(), method: this.method() });
  }
}
