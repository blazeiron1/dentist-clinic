import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../models';

export interface AuditLog {
  id: number;
  entityType: string;
  entityId: number | null;
  action: string;
  username: string;
  details: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getAll(page = 0, size = 20): Observable<Page<AuditLog>> {
    return this.http.get<Page<AuditLog>>(`${this.api}/audit`, {
      params: { page: page.toString(), size: size.toString() },
    });
  }

  exportBundle(): Observable<Blob> {
    return this.http.get(`${this.api}/audit/export`, { responseType: 'blob' });
  }
}
