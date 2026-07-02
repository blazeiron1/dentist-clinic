import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSortModule, Sort } from '@angular/material/sort';
import { CatalogService, CatalogCreateRequest } from '../../core/services/catalog.service';
import { CatalogItem } from '../../core/models';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatFormFieldModule, MatInputModule,
    MatSnackBarModule, MatProgressBarModule, MatTooltipModule,
    MatSortModule, CurrencyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Каталог на интервенции</h1>
        <button mat-flat-button color="primary" (click)="startAdd()">
          <mat-icon>add</mat-icon>
          Нова интервенција
        </button>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      <mat-card>
        <mat-card-content>
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Пребарај</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [ngModel]="searchQuery()" (ngModelChange)="onSearch($event)" placeholder="Внеси име..." />
            @if (searchQuery()) {
              <button matSuffix mat-icon-button (click)="onSearch('')">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>

          @if (filteredItems().length === 0 && !loading()) {
            <p class="empty-text">Нема пронајдени интервенции</p>
          }

          @if (filteredItems().length > 0) {
            <table mat-table [dataSource]="filteredItems()" matSort (matSortChange)="onSort($event)" class="catalog-table">

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Име</th>
                <td mat-cell *matCellDef="let row">
                  @if (editingId() === row.id) {
                    <mat-form-field appearance="outline" class="inline-field">
                      <input matInput [(ngModel)]="editName" (keyup.enter)="saveEdit(row)" (keyup.escape)="cancelEdit()" />
                    </mat-form-field>
                  } @else {
                    {{ row.name }}
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="lastPrice">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Последна цена</th>
                <td mat-cell *matCellDef="let row">
                  @if (editingId() === row.id) {
                    <mat-form-field appearance="outline" class="inline-field price-field">
                      <input matInput type="number" [(ngModel)]="editPrice" (keyup.enter)="saveEdit(row)" (keyup.escape)="cancelEdit()" />
                      <span matTextSuffix>ден</span>
                    </mat-form-field>
                  } @else {
                    @if (row.lastPrice != null) {
                      {{ row.lastPrice | currency:'MKD ':'symbol':'1.0-0' }}
                    } @else {
                      <span class="no-price">—</span>
                    }
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="usageCount">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Користено</th>
                <td mat-cell *matCellDef="let row">{{ row.usageCount }}×</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row">
                  @if (editingId() === row.id) {
                    <button mat-icon-button color="primary" (click)="saveEdit(row)" matTooltip="Зачувај">
                      <mat-icon>check</mat-icon>
                    </button>
                    <button mat-icon-button (click)="cancelEdit()" matTooltip="Откажи">
                      <mat-icon>close</mat-icon>
                    </button>
                  } @else {
                    <button mat-icon-button (click)="startEdit(row)" matTooltip="Измени">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="confirmDelete(row)" matTooltip="Избриши">
                      <mat-icon>delete</mat-icon>
                    </button>
                  }
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;" [class.editing-row]="editingId() === row.id"></tr>
            </table>
          }

          <!-- Inline add form -->
          @if (adding()) {
            <div class="add-form">
              <mat-form-field appearance="outline" class="add-name-field">
                <mat-label>Име на интервенција</mat-label>
                <input matInput [(ngModel)]="newName" (keyup.enter)="saveNew()" (keyup.escape)="cancelAdd()" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="add-price-field">
                <mat-label>Цена</mat-label>
                <input matInput type="number" [(ngModel)]="newPrice" (keyup.enter)="saveNew()" (keyup.escape)="cancelAdd()" />
                <span matTextSuffix>ден</span>
              </mat-form-field>
              <button mat-flat-button color="primary" (click)="saveNew()" [disabled]="!newName.trim()">
                <mat-icon>check</mat-icon>
                Додај
              </button>
              <button mat-stroked-button (click)="cancelAdd()">Откажи</button>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 900px; margin: 0 auto; }
    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 24px;
    }
    .page-title { margin: 0; font-weight: 500; }
    .page-header button mat-icon { margin-right: 4px; }
    .search-field { width: 100%; margin-bottom: 8px; }
    .search-field mat-icon { margin-right: 8px; color: rgba(0,0,0,.4); }
    .empty-text { color: rgba(0,0,0,.4); font-style: italic; padding: 16px 0; text-align: center; }
    .catalog-table { width: 100%; }
    .inline-field { margin: -8px 0; }
    .price-field { max-width: 140px; }
    .no-price { color: rgba(0,0,0,.3); }
    .editing-row { background: rgba(0,0,0,.02); }
    .add-form {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 16px 0 0;
      border-top: 1px solid rgba(0,0,0,.08);
      margin-top: 8px;
    }
    .add-name-field { flex: 1; }
    .add-price-field { width: 140px; }
    .add-form button mat-icon { margin-right: 4px; }
    th.mat-column-actions, td.mat-column-actions { width: 100px; text-align: right; }
    th.mat-column-usageCount, td.mat-column-usageCount { width: 120px; }
    th.mat-column-lastPrice, td.mat-column-lastPrice { width: 160px; }
  `],
})
export class CatalogComponent implements OnInit {
  private catalogSvc = inject(CatalogService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  items = signal<CatalogItem[]>([]);
  filteredItems = signal<CatalogItem[]>([]);
  loading = signal(false);
  searchQuery = signal('');

  // Inline editing
  editingId = signal<number | null>(null);
  editName = '';
  editPrice: number | null = null;

  // Adding
  adding = signal(false);
  newName = '';
  newPrice: number | null = null;

  columns = ['name', 'lastPrice', 'usageCount', 'actions'];

  private currentSort: Sort = { active: '', direction: '' };

  ngOnInit(): void {
    this.loadAll();
  }

  onSearch(q: string): void {
    this.searchQuery.set(q);
    this.applyFilter();
  }

  onSort(sort: Sort): void {
    this.currentSort = sort;
    this.applyFilter();
  }

  startAdd(): void {
    this.adding.set(true);
    this.cancelEdit();
    this.newName = '';
    this.newPrice = null;
  }

  cancelAdd(): void {
    this.adding.set(false);
  }

  saveNew(): void {
    const name = this.newName.trim();
    if (!name) return;
    this.loading.set(true);
    this.catalogSvc.create({ name, lastPrice: this.newPrice }).subscribe({
      next: () => {
        this.snackBar.open('Интервенцијата е додадена', '', { duration: 3000 });
        this.adding.set(false);
        this.loadAll();
      },
      error: (err) => {
        const msg = err.status === 409 ? 'Интервенција со тоа име веќе постои' : 'Грешка при додавање';
        this.snackBar.open(msg, '', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  startEdit(item: CatalogItem): void {
    this.editingId.set(item.id);
    this.editName = item.name;
    this.editPrice = item.lastPrice;
    this.cancelAdd();
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(item: CatalogItem): void {
    const name = this.editName.trim();
    if (!name) return;
    this.loading.set(true);
    this.catalogSvc.update(item.id, { name, lastPrice: this.editPrice }).subscribe({
      next: () => {
        this.snackBar.open('Интервенцијата е изменета', '', { duration: 3000 });
        this.editingId.set(null);
        this.loadAll();
      },
      error: (err) => {
        const msg = err.status === 409 ? 'Интервенција со тоа име веќе постои' : 'Грешка при измена';
        this.snackBar.open(msg, '', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  confirmDelete(item: CatalogItem): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Бришење на интервенција',
        message: `Дали сте сигурни дека сакате да ја избришете "${item.name}"?`,
        confirmText: 'Избриши',
        warn: true,
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.loading.set(true);
      this.catalogSvc.delete(item.id).subscribe({
        next: () => {
          this.snackBar.open('Интервенцијата е избришана', '', { duration: 3000 });
          this.loadAll();
        },
        error: () => {
          this.snackBar.open('Грешка при бришење', '', { duration: 3000 });
          this.loading.set(false);
        },
      });
    });
  }

  private loadAll(): void {
    this.loading.set(true);
    this.catalogSvc.search().subscribe({
      next: items => {
        this.items.set(items);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Грешка при вчитување на каталогот', '', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  private applyFilter(): void {
    let result = this.items();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      result = result.filter(item => item.name.toLowerCase().includes(q));
    }
    if (this.currentSort.active && this.currentSort.direction) {
      const dir = this.currentSort.direction === 'asc' ? 1 : -1;
      result = [...result].sort((a, b) => {
        const key = this.currentSort.active as keyof CatalogItem;
        const va = a[key] ?? 0;
        const vb = b[key] ?? 0;
        if (typeof va === 'string') return va.localeCompare(vb as string) * dir;
        return ((va as number) - (vb as number)) * dir;
      });
    }
    this.filteredItems.set(result);
  }
}
