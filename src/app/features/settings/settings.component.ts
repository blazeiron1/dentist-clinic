import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { BackupService, BackupInfo } from '../../core/services/backup.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressBarModule, MatSnackBarModule,
    DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <h1 class="page-title">Подесувања</h1>

      <!-- Backup Section -->
      <mat-card class="section-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>backup</mat-icon>
          <mat-card-title>Бекап и Обнова</mat-card-title>
          <mat-card-subtitle>Направи бекап на базата и датотеките или обнови од претходен бекап</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (loading()) {
            <mat-progress-bar mode="indeterminate" />
          }

          <div class="backup-actions">
            <button mat-flat-button color="primary" (click)="createBackup()" [disabled]="loading()">
              <mat-icon>cloud_download</mat-icon>
              Направи бекап
            </button>

            <button mat-stroked-button (click)="fileInput.click()" [disabled]="loading()">
              <mat-icon>cloud_upload</mat-icon>
              Обнови од бекап
            </button>
            <input #fileInput type="file" accept=".zip" hidden (change)="onRestoreFile($event)" />
          </div>

          <mat-divider />

          <h3 class="section-subtitle">Постоечки бекапи</h3>

          @if (backups().length === 0 && !loading()) {
            <p class="empty-text">Нема бекапи</p>
          }

          <div class="backup-list">
            @for (b of backups(); track b.filename) {
              <div class="backup-item">
                <mat-icon class="backup-icon">archive</mat-icon>
                <div class="backup-info">
                  <span class="backup-name">{{ b.filename }}</span>
                  <span class="backup-meta">{{ formatSize(b.sizeBytes) }} &middot; {{ b.createdAt | date:'d.M.y HH:mm' }}</span>
                </div>
                <button mat-icon-button (click)="downloadBackup(b)" matTooltip="Преземи">
                  <mat-icon>download</mat-icon>
                </button>
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 800px; margin: 0 auto; }
    .page-title { margin-bottom: 24px; font-weight: 500; }
    .section-card { margin-bottom: 24px; }
    .section-card mat-card-header { margin-bottom: 16px; }
    .section-subtitle { margin: 16px 0 8px; font-size: 14px; color: rgba(0,0,0,.6); }
    .backup-actions { display: flex; gap: 12px; margin-bottom: 16px; }
    .backup-actions button mat-icon { margin-right: 4px; }
    mat-divider { margin: 8px 0; }
    .empty-text { color: rgba(0,0,0,.4); font-style: italic; padding: 8px 0; }
    .backup-list { display: flex; flex-direction: column; gap: 4px; }
    .backup-item {
      display: flex; align-items: center; gap: 12px;
      padding: 8px 4px; border-radius: 8px;
      &:hover { background: rgba(0,0,0,.03); }
    }
    .backup-icon { color: rgba(0,0,0,.4); }
    .backup-info { flex: 1; display: flex; flex-direction: column; }
    .backup-name { font-size: 14px; font-weight: 500; }
    .backup-meta { font-size: 12px; color: rgba(0,0,0,.5); }
  `],
})
export class SettingsComponent implements OnInit {
  private backupSvc = inject(BackupService);
  private snackBar = inject(MatSnackBar);

  backups = signal<BackupInfo[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadBackups();
  }

  createBackup(): void {
    this.loading.set(true);
    this.backupSvc.create().subscribe({
      next: blob => {
        this.triggerDownload(blob, `dental_clinic_backup_${this.timestamp()}.zip`);
        this.snackBar.open('Бекапот е создаден', '', { duration: 3000 });
        this.loadBackups();
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Грешка при создавање бекап', '', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  downloadBackup(b: BackupInfo): void {
    this.backupSvc.download(b.filename).subscribe({
      next: blob => this.triggerDownload(blob, b.filename),
      error: () => this.snackBar.open('Грешка при преземање', '', { duration: 3000 }),
    });
  }

  onRestoreFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const confirmed = confirm(
      'ВНИМАНИЕ: Обновата ќе ги замени сите постоечки податоци.\n\nДали сте сигурни?'
    );
    if (!confirmed) {
      input.value = '';
      return;
    }

    this.loading.set(true);
    this.backupSvc.restore(file).subscribe({
      next: () => {
        this.snackBar.open('Обновата е завршена. Рестартирајте ја апликацијата.', '', { duration: 5000 });
        this.loading.set(false);
        this.loadBackups();
      },
      error: () => {
        this.snackBar.open('Грешка при обнова', '', { duration: 3000 });
        this.loading.set(false);
      },
    });
    input.value = '';
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  private loadBackups(): void {
    this.backupSvc.list().subscribe(list => this.backups.set(list));
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private timestamp(): string {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  }
}