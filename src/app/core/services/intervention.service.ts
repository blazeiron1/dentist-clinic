import { Injectable, signal } from '@angular/core';
import { Intervention } from '../models';
import { MOCK_INTERVENTIONS } from '../mock/mock-data';

@Injectable({ providedIn: 'root' })
export class InterventionService {
  private _interventions = signal<Intervention[]>(structuredClone(MOCK_INTERVENTIONS));

  readonly interventions = this._interventions.asReadonly();

  byAppointment(appointmentId: string): Intervention[] {
    return this._interventions().filter(i => i.appointmentId === appointmentId);
  }

  byPatient(patientId: string, appointmentIds: string[]): Intervention[] {
    const set = new Set(appointmentIds);
    return this._interventions().filter(i => set.has(i.appointmentId));
  }

  add(intervention: Omit<Intervention, 'id'>): Intervention {
    const next: Intervention = { ...intervention, id: 'i' + Date.now() };
    this._interventions.update(list => [...list, next]);
    return next;
  }

  update(id: string, patch: Partial<Intervention>): void {
    this._interventions.update(list =>
      list.map(i => (i.id === id ? { ...i, ...patch } : i))
    );
  }

  remove(id: string): void {
    this._interventions.update(list => list.filter(i => i.id !== id));
  }

  addPayment(interventionId: string, amount: number): void {
    this._interventions.update(list =>
      list.map(i =>
        i.id === interventionId
          ? { ...i, paidAmount: Math.min(i.paidAmount + amount, i.price) }
          : i
      )
    );
  }
}
