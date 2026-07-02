import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CatalogItem } from '../models';
import { environment } from '../../../environments/environment';

export interface CatalogCreateRequest {
  name: string;
  lastPrice: number | null;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  search(q?: string): Observable<CatalogItem[]> {
    const params: Record<string, string> = {};
    if (q) params['q'] = q;
    return this.http.get<CatalogItem[]>(`${this.api}/catalog`, { params });
  }

  create(dto: CatalogCreateRequest): Observable<CatalogItem> {
    return this.http.post<CatalogItem>(`${this.api}/catalog`, dto);
  }

  update(id: number, dto: CatalogCreateRequest): Observable<CatalogItem> {
    return this.http.put<CatalogItem>(`${this.api}/catalog/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/catalog/${id}`);
  }
}
