import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Payment, PaymentMethod } from '../models';
import { environment } from '../../../environments/environment';

const METHOD_FROM_BE: Record<string, PaymentMethod> = {
  CASH: 'cash', CARD: 'card', TRANSFER: 'transfer',
};

const METHOD_TO_BE: Record<string, string> = {
  cash: 'CASH', card: 'CARD', transfer: 'TRANSFER',
};

function mapPayment(p: any): Payment {
  return { ...p, method: METHOD_FROM_BE[p.method] ?? p.method };
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getByIntervention(interventionId: number): Observable<Payment[]> {
    return this.http.get<any[]>(`${this.api}/interventions/${interventionId}/payments`).pipe(
      map(list => list.map(mapPayment)),
    );
  }

  create(interventionId: number, dto: { amount: number; method: PaymentMethod; note?: string }): Observable<Payment> {
    return this.http.post<any>(`${this.api}/interventions/${interventionId}/payments`, {
      ...dto,
      method: METHOD_TO_BE[dto.method] ?? dto.method,
    }).pipe(map(mapPayment));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/payments/${id}`);
  }
}
