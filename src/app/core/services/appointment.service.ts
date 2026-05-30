import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Appointment, AppointmentStatus } from '../models';
import { environment } from '../../../environments/environment';

const STATUS_FROM_BE: Record<string, AppointmentStatus> = {
  SCHEDULED: 'scheduled', COMPLETED: 'completed',
  CANCELLED: 'cancelled', NO_SHOW: 'no-show',
};

const STATUS_TO_BE: Record<string, string> = {
  scheduled: 'SCHEDULED', completed: 'COMPLETED',
  cancelled: 'CANCELLED', 'no-show': 'NO_SHOW',
};

function mapAppt(a: any): Appointment {
  return { ...a, status: STATUS_FROM_BE[a.status] ?? a.status };
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  findByRange(from: Date, to: Date, patientId?: number): Observable<Appointment[]> {
    const params: Record<string, string> = {
      from: from.toISOString(),
      to: to.toISOString(),
    };
    if (patientId != null) params['patientId'] = String(patientId);
    return this.http.get<any[]>(`${this.api}/appointments`, { params }).pipe(
      map(list => list.map(mapAppt)),
    );
  }

  getById(id: number): Observable<Appointment> {
    return this.http.get<any>(`${this.api}/appointments/${id}`).pipe(map(mapAppt));
  }

  create(dto: { patientId: number; startsAt: string; endsAt: string; notes?: string }): Observable<Appointment> {
    return this.http.post<any>(`${this.api}/appointments`, dto).pipe(map(mapAppt));
  }

  update(id: number, dto: { patientId: number; startsAt: string; endsAt: string; notes?: string }): Observable<Appointment> {
    return this.http.put<any>(`${this.api}/appointments/${id}`, dto).pipe(map(mapAppt));
  }

  updateStatus(id: number, status: AppointmentStatus): Observable<Appointment> {
    return this.http.patch<any>(`${this.api}/appointments/${id}/status`, {
      status: STATUS_TO_BE[status] ?? status,
    }).pipe(map(mapAppt));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/appointments/${id}`);
  }
}
