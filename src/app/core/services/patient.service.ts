import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Patient, PatientCreate, Allergy, Condition, Medication, Page } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  search(q?: string, page = 0, size = 20): Observable<Page<Patient>> {
    const params: Record<string, string> = { page: String(page), size: String(size) };
    if (q) params['q'] = q;
    return this.http.get<Page<Patient>>(`${this.api}/patients`, { params });
  }

  getById(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.api}/patients/${id}`);
  }

  create(dto: PatientCreate): Observable<Patient> {
    return this.http.post<Patient>(`${this.api}/patients`, dto);
  }

  update(id: number, dto: PatientCreate): Observable<Patient> {
    return this.http.put<Patient>(`${this.api}/patients/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/patients/${id}`);
  }

  // --- Allergies ---

  getAllergies(patientId: number): Observable<Allergy[]> {
    return this.http.get<Allergy[]>(`${this.api}/patients/${patientId}/allergies`);
  }

  addAllergy(patientId: number, dto: { name: string; severity?: string; note?: string }): Observable<Allergy> {
    return this.http.post<Allergy>(`${this.api}/patients/${patientId}/allergies`, dto);
  }

  removeAllergy(patientId: number, allergyId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/patients/${patientId}/allergies/${allergyId}`);
  }

  // --- Conditions ---

  getConditions(patientId: number): Observable<Condition[]> {
    return this.http.get<Condition[]>(`${this.api}/patients/${patientId}/conditions`);
  }

  addCondition(patientId: number, dto: { name: string; diagnosedAt?: string; note?: string }): Observable<Condition> {
    return this.http.post<Condition>(`${this.api}/patients/${patientId}/conditions`, dto);
  }

  removeCondition(patientId: number, conditionId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/patients/${patientId}/conditions/${conditionId}`);
  }

  // --- Medications ---

  getMedications(patientId: number): Observable<Medication[]> {
    return this.http.get<Medication[]>(`${this.api}/patients/${patientId}/medications`);
  }

  addMedication(patientId: number, dto: { name: string; dosage?: string; active?: boolean }): Observable<Medication> {
    return this.http.post<Medication>(`${this.api}/patients/${patientId}/medications`, dto);
  }

  removeMedication(patientId: number, medicationId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/patients/${patientId}/medications/${medicationId}`);
  }
}
