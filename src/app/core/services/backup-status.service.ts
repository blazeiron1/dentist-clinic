import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BackupStatus {
  lastBackup: { filename: string; sizeBytes: number; createdAt: string } | null;
  daysSinceLastBackup: number;
  warningLevel: 'ok' | 'warning' | 'critical';
  backupCount: number;
}

@Injectable({ providedIn: 'root' })
export class BackupStatusService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  readonly status = signal<BackupStatus | null>(null);
  readonly dismissed = signal(false);

  load(): void {
    this.http.get<BackupStatus>(`${this.api}/backups/status`).pipe(
      tap(s => this.status.set(s)),
      catchError(() => of(null)),
    ).subscribe();
  }

  dismiss(): void {
    this.dismissed.set(true);
  }
}
