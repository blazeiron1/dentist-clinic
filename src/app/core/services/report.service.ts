import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ReportData } from '../models';
import { PAYMENT_METHOD_LABELS_BE } from '../constants';
import { environment } from '../../../environments/environment';

export interface OutstandingBalance {
  patientId: number;
  patientName: string;
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
}

export interface PatientFinancialReport {
  patientId: number;
  patientName: string;
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
  interventions: PatientInterventionDetail[];
}

export interface PatientInterventionDetail {
  id: number;
  name: string;
  teeth: number[];
  price: number;
  paidAmount: number;
  outstanding: number;
  performedAt: string | null;
  status: string;
}

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

  range(from: string, to: string): Observable<ReportData> {
    return this.http.get<any>(`${this.api}/reports/range`, { params: { from, to } }).pipe(map(mapReport));
  }

  outstanding(): Observable<OutstandingBalance[]> {
    return this.http.get<OutstandingBalance[]>(`${this.api}/reports/outstanding`);
  }

  patientsSummary(): Observable<OutstandingBalance[]> {
    return this.http.get<OutstandingBalance[]>(`${this.api}/reports/patients-summary`);
  }

  patientReport(patientId: number): Observable<PatientFinancialReport> {
    return this.http.get<PatientFinancialReport>(`${this.api}/reports/patient/${patientId}`);
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
