import {
  Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, effect, untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { ReportService } from '../../core/services/report.service';
import { ReportData } from '../../core/models';

type Range = 'today' | 'week' | 'month';

const EMPTY_REPORT: ReportData = {
  revenue: 0, outstanding: 0, appointmentCount: 0, interventionCount: 0,
  revenueByType: [], paymentMethodBreakdown: [],
};

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    FormsModule, DecimalPipe,
    MatButtonModule, MatButtonToggleModule, MatIconModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatDividerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit {
  private reportSvc = inject(ReportService);

  range = signal<Range>('month');
  data = signal<ReportData>(EMPTY_REPORT);

  maxBarValue = computed(() => {
    const vals = this.data().revenueByType.map(r => r.amount);
    return vals.length ? Math.max(...vals) : 1;
  });

  piePaths = computed(() => {
    const items = this.data().paymentMethodBreakdown;
    const total = items.reduce((s, i) => s + i.amount, 0);
    if (total === 0) return [];
    const colors = ['#1976d2', '#43a047', '#f57c00'];
    let cumAngle = -Math.PI / 2;
    return items.map((item, i) => {
      const slice = (item.amount / total) * 2 * Math.PI;
      const x1 = 60 + 55 * Math.cos(cumAngle);
      const y1 = 60 + 55 * Math.sin(cumAngle);
      cumAngle += slice;
      const x2 = 60 + 55 * Math.cos(cumAngle);
      const y2 = 60 + 55 * Math.sin(cumAngle);
      const large = slice > Math.PI ? 1 : 0;
      const pct = Math.round((item.amount / total) * 100);
      return { path: `M60,60 L${x1},${y1} A55,55 0 ${large},1 ${x2},${y2} Z`, color: colors[i % colors.length], label: item.label, pct };
    });
  });

  constructor() {
    effect(() => {
      const r = this.range();
      untracked(() => this.loadReport(r));
    });
  }

  ngOnInit(): void {
    this.loadReport(this.range());
  }

  print(): void { window.print(); }

  private loadReport(range: Range): void {
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    switch (range) {
      case 'today':
        this.reportSvc.daily(dateStr).subscribe(d => this.data.set(d));
        break;
      case 'week': {
        const day = today.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diff);
        const ws = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
        this.reportSvc.weekly(ws).subscribe(d => this.data.set(d));
        break;
      }
      case 'month': {
        const month = `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;
        this.reportSvc.monthly(month).subscribe(d => this.data.set(d));
        break;
      }
    }
  }
}
