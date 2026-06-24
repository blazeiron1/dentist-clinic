import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BackupInfo {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class BackupService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  list(): Observable<BackupInfo[]> {
    return this.http.get<BackupInfo[]>(`${this.api}/backups`);
  }

  create(): Observable<Blob> {
    return this.http.post(`${this.api}/backups`, null, { responseType: 'blob' });
  }

  download(filename: string): Observable<Blob> {
    return this.http.get(`${this.api}/backups/${filename}`, { responseType: 'blob' });
  }

  restore(file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<void>(`${this.api}/backups/restore`, formData);
  }
}
