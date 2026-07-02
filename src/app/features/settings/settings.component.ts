import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { BackupService, BackupInfo } from '../../core/services/backup.service';
import { AuditService, AuditLog } from '../../core/services/audit.service';
import { ClinicInfoService, ClinicInfo } from '../../core/services/clinic-info.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressBarModule, MatSnackBarModule,
    MatTableModule, MatPaginatorModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, ReactiveFormsModule,
    DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <h1 class="page-title">Подесувања</h1>

      <!-- Clinic Info Section -->
      <mat-card class="section-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>business</mat-icon>
          <mat-card-title>Информации за клиниката</mat-card-title>
          <mat-card-subtitle>Податоци кои се прикажуваат на извештаи и документи</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (clinicLoading()) {
            <mat-progress-bar mode="indeterminate" />
          }

          <!-- Logo Upload -->
          <div class="logo-section">
            <div class="logo-preview" (click)="logoInput.click()">
              @if (logoPreview()) {
                <img [src]="logoPreview()" alt="Лого" />
              } @else {
                <mat-icon>add_photo_alternate</mat-icon>
                <span>Додај лого</span>
              }
            </div>
            <div class="logo-actions">
              <button mat-stroked-button type="button" (click)="logoInput.click()" [disabled]="clinicLoading()">
                <mat-icon>upload</mat-icon>
                {{ logoPreview() ? 'Промени лого' : 'Прикачи лого' }}
              </button>
              <span class="logo-hint">JPG, PNG, SVG или WebP</span>
            </div>
            <input #logoInput type="file" accept="image/jpeg,image/png,image/svg+xml,image/webp" hidden
                   (change)="onLogoSelected($event)" />
          </div>

          <mat-divider />

          <form [formGroup]="clinicForm" (ngSubmit)="saveClinicInfo()" class="clinic-form">
            <mat-form-field appearance="outline">
              <mat-label>Име на клиниката</mat-label>
              <input matInput formControlName="name" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Адреса</mat-label>
              <input matInput formControlName="address" />
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Телефон</mat-label>
                <input matInput formControlName="phone" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Е-пошта</mat-label>
                <input matInput formControlName="email" type="email" />
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button mat-flat-button color="primary" type="submit"
                      [disabled]="clinicLoading() || clinicForm.invalid || clinicForm.pristine">
                <mat-icon>save</mat-icon>
                Зачувај
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

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
    .logo-section {
      display: flex; align-items: center; gap: 20px;
      margin-bottom: 16px;
    }
    .logo-preview {
      width: 80px; height: 80px;
      border: 2px dashed rgba(0,0,0,.2);
      border-radius: 8px;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      cursor: pointer;
      overflow: hidden;
      transition: border-color 0.2s;
      &:hover { border-color: var(--mat-sys-primary); }
      img { width: 100%; height: 100%; object-fit: contain; }
      mat-icon { color: rgba(0,0,0,.3); font-size: 32px; width: 32px; height: 32px; }
      span { font-size: 11px; color: rgba(0,0,0,.4); }
    }
    .logo-actions { display: flex; flex-direction: column; gap: 4px; }
    .logo-actions button mat-icon { margin-right: 4px; }
    .logo-hint { font-size: 12px; color: rgba(0,0,0,.4); }
    .clinic-form { display: flex; flex-direction: column; gap: 4px; margin-top: 16px; }
    .clinic-form mat-form-field { width: 100%; }
    .form-row { display: flex; gap: 16px; }
    .form-row mat-form-field { flex: 1; }
    .form-actions { display: flex; justify-content: flex-end; }
    .form-actions button mat-icon { margin-right: 4px; }
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
  private clinicInfoSvc = inject(ClinicInfoService);
  private auditSvc = inject(AuditService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  backups = signal<BackupInfo[]>([]);
  loading = signal(false);
  clinicLoading = signal(false);
  logoPreview = signal<string | null>(null);

  clinicForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    address: [''],
    phone: [''],
    email: [''],
  });

  auditLogs = signal<AuditLog[]>([]);
  auditTotal = signal(0);
  auditPage = signal(0);
  auditLoading = signal(false);
  exporting = signal(false);

  auditColumns = ['createdAt', 'username', 'action', 'entity', 'details'];

  ngOnInit(): void {
    this.loadBackups();
    this.loadClinicInfo();
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.clinicLoading.set(true);
    this.clinicInfoSvc.uploadLogo(file).subscribe({
      next: info => {
        this.logoPreview.set(info.logoUrl + '?t=' + Date.now());
        this.snackBar.open('Логото е прикачено', '', { duration: 3000 });
        this.clinicLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Грешка при прикачување на лого', '', { duration: 3000 });
        this.clinicLoading.set(false);
      },
    });
    input.value = '';
  }

  saveClinicInfo(): void {
    if (this.clinicForm.invalid) return;
    this.clinicLoading.set(true);
    const formValue = this.clinicForm.getRawValue();
    const info: ClinicInfo = { ...formValue, logoUrl: this.clinicInfoSvc.clinicInfo().logoUrl };
    this.clinicInfoSvc.update(info).subscribe({
      next: () => {
        this.snackBar.open('Информациите се зачувани', '', { duration: 3000 });
        this.clinicForm.markAsPristine();
        this.clinicLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Грешка при зачувување', '', { duration: 3000 });
        this.clinicLoading.set(false);
      },
    });
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

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        title: 'Обнова од бекап',
        message: 'ВНИМАНИЕ: Обновата ќе ги замени сите постоечки податоци. Дали сте сигурни?',
        confirmText: 'Обнови',
        warn: true,
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) {
        input.value = '';
        return;
      }
      this.loading.set(true);
      this.backupSvc.restore(file).subscribe({
        next: () => {
          this.snackBar.open('Обновата е завршена. Страницата ќе се рестартира...', '', { duration: 3000 });
          setTimeout(() => window.location.href = '/login', 2000);
        },
        error: () => {
          this.snackBar.open('Грешка при обнова', '', { duration: 3000 });
          this.loading.set(false);
        },
      });
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

  private loadClinicInfo(): void {
    this.clinicLoading.set(true);
    this.clinicInfoSvc.load().subscribe({
      next: info => {
        this.clinicForm.patchValue(info);
        this.clinicForm.markAsPristine();
        if (info.logoUrl) {
          this.logoPreview.set(info.logoUrl);
        }
        this.clinicLoading.set(false);
      },
      error: () => this.clinicLoading.set(false),
    });
  }

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
