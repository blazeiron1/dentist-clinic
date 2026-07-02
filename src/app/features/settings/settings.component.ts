import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';
import { BackupService, BackupInfo } from '../../core/services/backup.service';
import { AuditService, AuditLog } from '../../core/services/audit.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressBarModule, MatSnackBarModule,
    MatTableModule, MatPaginatorModule, MatChipsModule,
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

      <!-- Audit Log Section -->
      <mat-card class="section-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>history</mat-icon>
          <mat-card-title>Евиденција на активности</mat-card-title>
          <mat-card-subtitle>Преглед на сите акции во системот</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="backup-actions">
            <button mat-flat-button color="primary" (click)="sendLogs()" [disabled]="exporting()">
              <mat-icon>email</mat-icon>
              Испрати логови на поддршка
            </button>
          </div>

          @if (exporting()) {
            <mat-progress-bar mode="indeterminate" />
          }

          @if (auditLogs().length === 0 && !auditLoading()) {
            <p class="empty-text">Нема записи</p>
          }

          @if (auditLogs().length > 0) {
            <table mat-table [dataSource]="auditLogs()" class="audit-table">
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>Време</th>
                <td mat-cell *matCellDef="let row">{{ row.createdAt | date:'d.M.y HH:mm' }}</td>
              </ng-container>

              <ng-container matColumnDef="username">
                <th mat-header-cell *matHeaderCellDef>Корисник</th>
                <td mat-cell *matCellDef="let row">{{ row.username }}</td>
              </ng-container>

              <ng-container matColumnDef="action">
                <th mat-header-cell *matHeaderCellDef>Акција</th>
                <td mat-cell *matCellDef="let row">
                  <mat-chip-set>
                    <mat-chip [class]="'action-' + row.action.toLowerCase()" highlighted>
                      {{ actionLabel(row.action) }}
                    </mat-chip>
                  </mat-chip-set>
                </td>
              </ng-container>

              <ng-container matColumnDef="entity">
                <th mat-header-cell *matHeaderCellDef>Ентитет</th>
                <td mat-cell *matCellDef="let row">{{ entityLabel(row.entityType) }} {{ row.entityId ? '#' + row.entityId : '' }}</td>
              </ng-container>

              <ng-container matColumnDef="details">
                <th mat-header-cell *matHeaderCellDef>Детали</th>
                <td mat-cell *matCellDef="let row" class="details-cell">{{ row.details || '-' }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="auditColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: auditColumns;"></tr>
            </table>

            <mat-paginator
              [length]="auditTotal()"
              [pageSize]="20"
              [pageIndex]="auditPage()"
              [pageSizeOptions]="[10, 20, 50]"
              (page)="onAuditPage($event)"
              showFirstLastButtons />
          }
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

    .audit-table { width: 100%; }
    .details-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .action-create { --mdc-chip-label-text-color: #2e7d32; --mdc-chip-elevated-container-color: #e8f5e9; }
    .action-update { --mdc-chip-label-text-color: #1565c0; --mdc-chip-elevated-container-color: #e3f2fd; }
    .action-delete { --mdc-chip-label-text-color: #c62828; --mdc-chip-elevated-container-color: #ffebee; }
    mat-paginator { margin-top: 8px; }
  `],
})
export class SettingsComponent implements OnInit {
  private backupSvc = inject(BackupService);
  private auditSvc = inject(AuditService);
  private snackBar = inject(MatSnackBar);

  backups = signal<BackupInfo[]>([]);
  loading = signal(false);

  auditLogs = signal<AuditLog[]>([]);
  auditTotal = signal(0);
  auditPage = signal(0);
  auditLoading = signal(false);
  exporting = signal(false);

  auditColumns = ['createdAt', 'username', 'action', 'entity', 'details'];

  ngOnInit(): void {
    this.loadBackups();
    this.loadAuditLogs(0, 20);
  }

  // --- Backup ---

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

  // --- Audit ---

  onAuditPage(event: PageEvent): void {
    this.auditPage.set(event.pageIndex);
    this.loadAuditLogs(event.pageIndex, event.pageSize);
  }

  sendLogs(): void {
    this.exporting.set(true);
    this.auditSvc.exportBundle().subscribe({
      next: blob => {
        this.triggerDownload(blob, `dental-clinic-logs_${this.timestamp()}.zip`);
        this.exporting.set(false);
        const recipients = 'kostoskid66@gmail.com,blagoja663@gmail.com';
        const subject = encodeURIComponent('Dental Clinic - Логови');
        const body = encodeURIComponent(
          'Здраво,\n\nВо прилог се логовите од Dental Clinic апликацијата.\n\nВе молам прикачете го преземениот фајл: dental-clinic-logs_' + this.timestamp() + '.zip'
        );
        window.open(`mailto:${recipients}?subject=${subject}&body=${body}`, '_self');
      },
      error: () => {
        this.snackBar.open('Грешка при преземање логови', '', { duration: 3000 });
        this.exporting.set(false);
      },
    });
  }

  actionLabel(action: string): string {
    const labels: Record<string, string> = {
      'CREATE': 'Креирање',
      'UPDATE': 'Измена',
      'DELETE': 'Бришење',
      'COMPLETE': 'Завршено',
      'CANCEL': 'Откажано',
    };
    return labels[action] || action;
  }

  entityLabel(entityType: string): string {
    const labels: Record<string, string> = {
      'PATIENT': 'Пациент',
      'APPOINTMENT': 'Термин',
      'INTERVENTION': 'Интервенција',
      'PAYMENT': 'Плаќање',
      'DOCUMENT': 'Документ',
      'BACKUP': 'Бекап',
    };
    return labels[entityType] || entityType;
  }

  // --- Private ---

  private loadBackups(): void {
    this.backupSvc.list().subscribe(list => this.backups.set(list));
  }

  private loadAuditLogs(page: number, size: number): void {
    this.auditLoading.set(true);
    this.auditSvc.getAll(page, size).subscribe({
      next: res => {
        this.auditLogs.set(res.content);
        this.auditTotal.set(res.totalElements);
        this.auditLoading.set(false);
      },
      error: () => this.auditLoading.set(false),
    });
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