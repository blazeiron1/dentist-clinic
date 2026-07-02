import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export type HealthStatus = 'healthy' | 'degraded' | 'unreachable';

@Injectable({ providedIn: 'root' })
export class HealthService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  readonly status = signal<HealthStatus>('healthy');
  readonly lastCheck = signal<Date | null>(null);

  startPolling(intervalMs = 30_000): void {
    this.check();
    this.intervalId = setInterval(() => this.check(), intervalMs);
  }

  stopPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  check(): void {
    this.http.get<{ status: string }>(`${this.api}/status`).pipe(
      tap(res => {
        this.status.set(res.status === 'healthy' ? 'healthy' : 'degraded');
        this.lastCheck.set(new Date());
      }),
      catchError(() => {
        this.status.set('unreachable');
        this.lastCheck.set(new Date());
        return of(null);
      }),
    ).subscribe();
  }
}
