import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { TipService, Tip } from '../../core/services/tip.service';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatExpansionModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <h1 class="page-title">Помош</h1>
      <p class="page-subtitle">Упатства и совети за користење на апликацијата</p>

      <!-- Category filter chips -->
      <mat-chip-set class="category-chips">
        <mat-chip [highlighted]="activeCategory() === 'all'" (click)="filterCategory('all')">
          <mat-icon matChipAvatar>apps</mat-icon>
          Сите
        </mat-chip>
        @for (cat of categories; track cat.key) {
          <mat-chip [highlighted]="activeCategory() === cat.key" (click)="filterCategory(cat.key)">
            <mat-icon matChipAvatar>{{ cat.icon }}</mat-icon>
            {{ cat.label }}
          </mat-chip>
        }
      </mat-chip-set>

      <!-- Tips grouped by category -->
      @for (cat of visibleCategories(); track cat.key) {
        <div class="category-section">
          <h2 class="category-title">
            <mat-icon>{{ cat.icon }}</mat-icon>
            {{ cat.label }}
          </h2>

          <div class="tips-grid">
            @for (tip of getTips(cat.key); track tip.id) {
              <mat-card class="tip-card" appearance="outlined">
                <mat-card-header>
                  <mat-icon mat-card-avatar class="tip-card-icon">{{ tip.icon }}</mat-icon>
                  <mat-card-title>{{ tip.title }}</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p>{{ tip.body }}</p>
                </mat-card-content>
              </mat-card>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 900px; margin: 0 auto; }
    .page-title { margin-bottom: 4px; font-weight: 500; }
    .page-subtitle { color: rgba(0,0,0,.5); margin-bottom: 20px; font-size: 14px; }
    .category-chips { margin-bottom: 24px; }
    .category-chips mat-chip { cursor: pointer; }
    .category-section { margin-bottom: 32px; }
    .category-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 18px; font-weight: 500; margin-bottom: 12px;
      color: rgba(0,0,0,.7);
    }
    .category-title mat-icon { color: var(--mat-sys-primary, #1976d2); }
    .tips-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }
    .tip-card { transition: box-shadow 0.2s; }
    .tip-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.1); }
    .tip-card mat-card-header { margin-bottom: 4px; }
    .tip-card-icon { color: var(--mat-sys-primary, #1976d2); }
    .tip-card p { font-size: 13px; color: rgba(0,0,0,.6); line-height: 1.5; margin: 0; }
  `],
})
export class HelpComponent {
  private tipSvc = inject(TipService);

  categories = this.tipSvc.getCategories();
  activeCategory = signal<string>('all');

  filterCategory(key: string): void {
    this.activeCategory.set(key);
  }

  visibleCategories() {
    const active = this.activeCategory();
    if (active === 'all') return this.categories;
    return this.categories.filter(c => c.key === active);
  }

  getTips(category: string): Tip[] {
    return this.tipSvc.getTipsByCategory(category);
  }
}
