import { Injectable, signal, computed } from '@angular/core';
import { Patient } from '../models';
import { MOCK_PATIENTS } from '../mock/mock-data';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private _patients = signal<Patient[]>(structuredClone(MOCK_PATIENTS));

  readonly patients = this._patients.asReadonly();

  search(query: string): Patient[] {
    const q = query.toLowerCase().trim();
    if (!q) return this._patients();
    return this._patients().filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      (p.embg ?? '').includes(q)
    );
  }

  getById(id: string): Patient | undefined {
    return this._patients().find(p => p.id === id);
  }

  add(patient: Omit<Patient, 'id' | 'createdAt'>): Patient {
    const next: Patient = {
      ...patient,
      id: 'p' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    this._patients.update(list => [...list, next]);
    return next;
  }

  update(id: string, patch: Partial<Patient>): void {
    this._patients.update(list =>
      list.map(p => (p.id === id ? { ...p, ...patch } : p))
    );
  }
}
