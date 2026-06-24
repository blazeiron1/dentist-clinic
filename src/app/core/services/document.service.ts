import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PatientDocument } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  list(patientId: number): Observable<PatientDocument[]> {
    return this.http.get<PatientDocument[]>(`${this.api}/patients/${patientId}/documents`);
  }

  upload(patientId: number, file: File, category?: string): Observable<PatientDocument> {
    const formData = new FormData();
    formData.append('file', file);
    if (category) formData.append('category', category);
    return this.http.post<PatientDocument>(`${this.api}/patients/${patientId}/documents`, formData);
  }

  download(docId: number): Observable<Blob> {
    return this.http.get(`${this.api}/documents/${docId}`, { responseType: 'blob' });
  }

  delete(docId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/documents/${docId}`);
  }
}
