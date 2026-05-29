import {
  Component, inject, signal, computed, OnInit, ChangeDetectionStrategy,
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
import { ReportService, ReportData } from '../../core/services/report.service';

type Range = 'today' | 'week' | 'month' | 'custom';

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
  customFrom = signal('');
  customTo = signal('');

  private dates = computed<{ from: Date; to: Date }>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    switch (this.range()) {
      case 'today': {
        const to = new Date(today); to.setHours(23, 59, 59);
        return { from: today, to };
      }
      case 'week': {
        const mon = new Date(today);
        const diff = today.getDay() === 0 ? -6 : 1 - today.getDay();
        mon.setDate(today.getDate() + diff);
        const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23, 59, 59);
        return { from: mon, to: sun };
      }
      case 'custom': {
        const f = this.customFrom() ? new Date(this.customFrom()) : today;
        const t = this.customTo() ? new Date(this.customTo()) : today;
        t.setHours(23, 59, 59);
        return { from: f, to: t };
      }
      default: { // month
        const from = new Date(today.getFullYear(), today.getMonth(), 1);
        const to = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
        return { from, to };
      }
    }
  });

  data = computed<ReportData>(() => this.reportSvc.compute(this.dates().from, this.dates().to));

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

  ngOnInit(): void {
    const today = new Date();
    this.customFrom.set(today.toISOString().slice(0, 10));
    this.customTo.set(today.toISOString().slice(0, 10));
  }

  print(): void { window.print(); }
}
