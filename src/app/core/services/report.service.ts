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
  lastVisit: string | null;
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

export interface PatientHistoryReport {
  patientId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  phone: string | null;
  email: string | null;
  embg: string | null;
  appointments: AppointmentReportEntry[];
  totalCharged: number;
  totalPaid: number;
  totalOutstanding: number;
}

export interface AppointmentReportEntry {
  id: number;
  startsAt: string;
  endsAt: string;
  status: string;
  notes: string | null;
  interventions: ReportInterventionEntry[];
  appointmentCharged: number;
  appointmentPaid: number;
  appointmentOutstanding: number;
}

export interface ReportInterventionEntry {
  id: number;
  name: string;
  teeth: number[];
  price: number;
  paidAmount: number;
  outstanding: number;
  note: string | null;
  performedAt: string | null;
}

export interface AppointmentReport {
  appointmentId: number;
  startsAt: string;
  endsAt: string;
  status: string;
  notes: string | null;
  patientId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  phone: string | null;
  interventions: ReportInterventionEntry[];
  totalCharged: number;
  totalPaid: number;
  totalOutstanding: number;
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

  patientsSummary(params?: { from?: string; to?: string; q?: string; debt?: string; sort?: string; dir?: string }): Observable<OutstandingBalance[]> {
    const httpParams: Record<string, string> = {};
    if (params?.from) httpParams['from'] = params.from;
    if (params?.to) httpParams['to'] = params.to;
    if (params?.q) httpParams['q'] = params.q;
    if (params?.debt) httpParams['debt'] = params.debt;
    if (params?.sort) httpParams['sort'] = params.sort;
    if (params?.dir) httpParams['dir'] = params.dir;
    return this.http.get<OutstandingBalance[]>(`${this.api}/reports/patients-summary`, { params: httpParams });
  }

  patientReport(patientId: number): Observable<PatientFinancialReport> {
    return this.http.get<PatientFinancialReport>(`${this.api}/reports/patient/${patientId}`);
  }

  patientHistoryReport(patientId: number): Observable<PatientHistoryReport> {
    return this.http.get<PatientHistoryReport>(`${this.api}/reports/patient/${patientId}/history`);
  }

  appointmentReport(appointmentId: number): Observable<AppointmentReport> {
    return this.http.get<AppointmentReport>(`${this.api}/reports/appointment/${appointmentId}`);
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
