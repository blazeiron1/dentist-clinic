import { Injectable, signal } from '@angular/core';
import { Payment, PaymentMethod } from '../models';
import { MOCK_PAYMENTS } from '../mock/mock-data';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private _payments = signal<Payment[]>(structuredClone(MOCK_PAYMENTS));

  readonly payments = this._payments.asReadonly();

  byIntervention(interventionId: string): Payment[] {
    return this._payments().filter(p => p.interventionId === interventionId);
  }

  add(interventionId: string, amount: number, method: PaymentMethod): Payment {
    const next: Payment = {
      id: 'pay' + Date.now(),
      interventionId,
      amount,
      method,
      date: new Date().toISOString().slice(0, 10),
    };
    this._payments.update(list => [...list, next]);
    return next;
  }
}
