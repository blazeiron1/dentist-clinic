import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CatalogItem } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  search(q?: string): Observable<CatalogItem[]> {
    const params: Record<string, string> = {};
    if (q) params['q'] = q;
    return this.http.get<CatalogItem[]>(`${this.api}/catalog`, { params });
  }
}
