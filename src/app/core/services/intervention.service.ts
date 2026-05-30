import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Intervention } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InterventionService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getByAppointment(appointmentId: number): Observable<Intervention[]> {
    return this.http.get<Intervention[]>(`${this.api}/appointments/${appointmentId}/interventions`);
  }

  create(appointmentId: number, dto: { name: string; price: number; teeth?: number[]; note?: string }): Observable<Intervention> {
    return this.http.post<Intervention>(`${this.api}/appointments/${appointmentId}/interventions`, dto);
  }

  update(id: number, dto: { name: string; price: number; teeth?: number[]; note?: string }): Observable<Intervention> {
    return this.http.put<Intervention>(`${this.api}/interventions/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/interventions/${id}`);
  }
}
