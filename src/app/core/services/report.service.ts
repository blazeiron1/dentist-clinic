import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ReportData } from '../models';
import { PAYMENT_METHOD_LABELS_BE } from '../constants';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  daily(date: string): Observable<ReportData> {
    return this.http.get<any>(`${this.api}/reports/daily`, { params: { date } }).pipe(map(mapReport));
  }

  weekly(weekStart: string): Observable<ReportData> {
    return this.http.get<any>(`${this.api}/reports/weekly`, { params: { weekStart } }).pipe(map(mapReport));
  }

  monthly(month: string): Observable<ReportData> {
    return this.http.get<any>(`${this.api}/reports/monthly`, { params: { month } }).pipe(map(mapReport));
  }
}

function mapReport(r: any): ReportData {
  return {
    revenue: r.revenueCollected ?? 0,
    outstanding: r.revenueOutstanding ?? 0,
    appointmentCount: r.appointmentsCompleted ?? 0,
    interventionCount: r.interventionsCount ?? 0,
    revenueByType: (r.byInterventionType ?? []).map((t: any) => ({
      name: t.name,
      amount: t.revenue ?? 0,
    })),
    paymentMethodBreakdown: Object.entries(r.paymentsByMethod ?? {}).map(([method, amount]) => ({
      method: method.toLowerCase(),
      amount: amount as number,
      label: PAYMENT_METHOD_LABELS_BE[method] ?? method,
    })),
  };
}
