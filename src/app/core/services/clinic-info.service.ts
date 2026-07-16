import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, retry, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ClinicInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
}

@Injectable({ providedIn: 'root' })
export class ClinicInfoService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/settings/clinic`;

  readonly clinicInfo = signal<ClinicInfo>({
    name: '',
    address: '',
    phone: '',
    email: '',
    logoUrl: '/logo.png',
  });

  private loaded = false;

  load(): Observable<ClinicInfo> {
    return this.http.get<ClinicInfo>(this.api).pipe(
      retry({ count: 2, delay: 1000 }),
      tap(info => {
        this.clinicInfo.set(info);
        this.loaded = true;
      }),
      catchError(() => of(this.clinicInfo()))
    );
  }

  ensureLoaded(): Observable<ClinicInfo> {
    if (this.loaded && this.clinicInfo().name) {
      return of(this.clinicInfo());
    }
    return this.load();
  }

  update(info: ClinicInfo): Observable<ClinicInfo> {
    return this.http.put<ClinicInfo>(this.api, info).pipe(
      tap(saved => this.clinicInfo.set(saved))
    );
  }

  uploadLogo(file: File): Observable<ClinicInfo> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ClinicInfo>(`${this.api}/logo`, formData).pipe(
      tap(saved => this.clinicInfo.set(saved))
    );
  }
}
