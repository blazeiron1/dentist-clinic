import { Injectable, signal } from '@angular/core';
import { Appointment, AppointmentStatus } from '../models';
import { MOCK_APPOINTMENTS } from '../mock/mock-data';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private _appointments = signal<Appointment[]>(structuredClone(MOCK_APPOINTMENTS));

  readonly appointments = this._appointments.asReadonly();

  getById(id: string): Appointment | undefined {
    return this._appointments().find(a => a.id === id);
  }

  byPatient(patientId: string): Appointment[] {
    return this._appointments()
      .filter(a => a.patientId === patientId)
      .sort((a, b) => b.dateTime.localeCompare(a.dateTime));
  }

  byDateRange(from: Date, to: Date): Appointment[] {
    const f = from.toISOString();
    const t = to.toISOString();
    return this._appointments().filter(a => a.dateTime >= f && a.dateTime <= t);
  }

  add(appt: Omit<Appointment, 'id' | 'createdAt'>): Appointment {
    const next: Appointment = { ...appt, id: 'a' + Date.now(), createdAt: new Date().toISOString() };
    this._appointments.update(list => [...list, next]);
    return next;
  }

  updateStatus(id: string, status: AppointmentStatus): void {
    this._appointments.update(list =>
      list.map(a => (a.id === id ? { ...a, status } : a))
    );
  }

  update(id: string, patch: Partial<Appointment>): void {
    this._appointments.update(list =>
      list.map(a => (a.id === id ? { ...a, ...patch } : a))
    );
  }
}
