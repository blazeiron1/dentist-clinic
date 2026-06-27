import {
  Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, effect, untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReportService, OutstandingBalance, PatientFinancialReport } from '../../core/services/report.service';
import { PatientService } from '../../core/services/patient.service';
import { ReportData, Patient } from '../../core/models';
import * as XLSX from 'xlsx';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, filter } from 'rxjs/operators';

type Range = 'today' | 'week' | 'month' | 'custom';

const EMPTY_REPORT: ReportData = {
  revenue: 0, outstanding: 0, appointmentCount: 0, interventionCount: 0,
  revenueByType: [], paymentMethodBreakdown: [],
};

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    FormsModule, DatePipe, DecimalPipe, RouterLink,
    MatButtonModule, MatButtonToggleModule, MatIconModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatDividerModule,
    MatTabsModule, MatTableModule, MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit {
  private reportSvc = inject(ReportService);
  private patientSvc = inject(PatientService);

  range = signal<Range>('month');
  data = signal<ReportData>(EMPTY_REPORT);
  outstandingList = signal<OutstandingBalance[]>([]);
  outstandingCols = ['patient', 'billed', 'paid', 'outstanding'];

  customFrom = signal('');
  customTo = signal('');
  selectedTab = 0;

  // All-patients summary
  allPatientsList = signal<OutstandingBalance[]>([]);
  allPatientsCols = ['patient', 'date', 'billed', 'paid', 'outstanding'];
  apFrom = signal('');
  apTo = signal('');
  apQuery = signal('');
  apSort = signal('name');
  apDir = signal<'asc' | 'desc'>('asc');
  private apSearchSubject = new Subject<string>();

  // Per-patient report
  patientQuery = signal('');
  patientSearchResults = signal<Patient[]>([]);
  patientReport = signal<PatientFinancialReport | null>(null);
  patientReportCols = ['date', 'intervention', 'teeth', 'price', 'paid', 'outstanding'];
  private searchSubject = new Subject<string>();

  maxBarValue = computed(() => {
    const vals = this.data().revenueByType.map(r => r.amount);
    return vals.length ? Math.max(...vals) : 1;
  });

  totalOutstanding = computed(() =>
    this.outstandingList().reduce((s, o) => s + o.outstanding, 0)
  );

  allPatientsTotal = computed(() => ({
    billed: this.allPatientsList().reduce((s, o) => s + o.totalBilled, 0),
    paid: this.allPatientsList().reduce((s, o) => s + o.totalPaid, 0),
    outstanding: this.allPatientsList().reduce((s, o) => s + o.outstanding, 0),
  }));

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
      if (r !== 'custom') {
        untracked(() => this.loadReport(r));
      }
    });

    this.apSearchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
    ).subscribe(() => this.loadAllPatients());

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(q => q.length >= 2),
      switchMap(q => this.patientSvc.search(q, 0, 10)),
    ).subscribe(page => this.patientSearchResults.set(page.content));
  }

  ngOnInit(): void {
    this.loadReport(this.range());
    this.loadOutstanding();
    this.loadAllPatients();
  }

  loadCustom(): void {
    const from = this.customFrom();
    const to = this.customTo();
    if (!from || !to) return;
    this.reportSvc.range(from, to).subscribe(d => this.data.set(d));
  }

  // ── Print methods ─────────────────────────────────────────────────────────

  printFinancialReport(): void {
    const d = this.data();
    const fmt = (n: number) => n.toLocaleString('mk-MK');

    const typeRows = d.revenueByType.map(r =>
      `<tr><td>${r.name}</td><td class="num">${fmt(r.amount)}</td></tr>`
    ).join('');

    const payRows = d.paymentMethodBreakdown.map(p =>
      `<tr><td>${p.label}</td><td class="num">${fmt(p.amount)}</td></tr>`
    ).join('');

    this.openPrintWindow(
      `Финансиски извештај — ${this.rangeLabel()}`,
      `<div class="summary">
        <div class="summary-item"><span class="summary-label">Приход</span><span class="summary-value">${fmt(d.revenue)} ден</span></div>
        <div class="summary-item"><span class="summary-label">Неплатено</span><span class="summary-value debt">${fmt(d.outstanding)} ден</span></div>
        <div class="summary-item"><span class="summary-label">Средби</span><span class="summary-value">${d.appointmentCount}</span></div>
        <div class="summary-item"><span class="summary-label">Интервенции</span><span class="summary-value">${d.interventionCount}</span></div>
      </div>
      ${typeRows ? `<h3>Приход по вид интервенција</h3>
      <table><thead><tr><th>Интервенција</th><th class="num">Износ</th></tr></thead>
      <tbody>${typeRows}</tbody></table>` : ''}
      ${payRows ? `<h3>Начин на плаќање</h3>
      <table><thead><tr><th>Начин</th><th class="num">Износ</th></tr></thead>
      <tbody>${payRows}</tbody></table>` : ''}`
    );
  }

  printOutstanding(): void {
    const list = this.outstandingList();
    const fmt = (n: number) => n.toLocaleString('mk-MK');
    const total = this.totalOutstanding();

    const rows = list.map(o =>
      `<tr><td>${o.patientName}</td><td class="num">${fmt(o.totalBilled)}</td><td class="num">${fmt(o.totalPaid)}</td><td class="num debt">${fmt(o.outstanding)}</td></tr>`
    ).join('');

    this.openPrintWindow(
      'Неплатени пациенти',
      `<p class="total">Вкупен долг: <strong>${fmt(total)} ден</strong></p>
      <table>
        <thead><tr><th>Пациент</th><th class="num">Наплатено</th><th class="num">Платено</th><th class="num">Долг</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td><strong>Вкупно</strong></td>
          <td class="num"><strong>${fmt(list.reduce((s, o) => s + o.totalBilled, 0))}</strong></td>
          <td class="num"><strong>${fmt(list.reduce((s, o) => s + o.totalPaid, 0))}</strong></td>
          <td class="num debt"><strong>${fmt(total)}</strong></td>
        </tr></tfoot>
      </table>`
    );
  }

  printAllPatients(): void {
    const list = this.allPatientsList();
    const totals = this.allPatientsTotal();
    const fmt = (n: number) => n.toLocaleString('mk-MK');

    const rows = list.map(o => {
      const debtClass = o.outstanding > 0 ? ' debt' : '';
      return `<tr><td>${o.patientName}</td><td class="num">${fmt(o.totalBilled)}</td><td class="num">${fmt(o.totalPaid)}</td><td class="num${debtClass}">${fmt(o.outstanding)}</td></tr>`;
    }).join('');

    this.openPrintWindow(
      `Збирен извештај — сите пациенти (${list.length})`,
      `<div class="summary">
        <div class="summary-item"><span class="summary-label">Вкупно наплатено</span><span class="summary-value">${fmt(totals.billed)} ден</span></div>
        <div class="summary-item"><span class="summary-label">Вкупно платено</span><span class="summary-value paid">${fmt(totals.paid)} ден</span></div>
        <div class="summary-item"><span class="summary-label">Вкупен долг</span><span class="summary-value${totals.outstanding > 0 ? ' debt' : ''}">${fmt(totals.outstanding)} ден</span></div>
      </div>
      <table>
        <thead><tr><th>Пациент</th><th class="num">Наплатено</th><th class="num">Платено</th><th class="num">Долг</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td><strong>Вкупно (${list.length} пациенти)</strong></td>
          <td class="num"><strong>${fmt(totals.billed)}</strong></td>
          <td class="num"><strong>${fmt(totals.paid)}</strong></td>
          <td class="num${totals.outstanding > 0 ? ' debt' : ''}"><strong>${fmt(totals.outstanding)}</strong></td>
        </tr></tfoot>
      </table>`
    );
  }

  printPatientReport(): void {
    const pr = this.patientReport();
    if (!pr) return;
    const fmt = (n: number) => n.toLocaleString('mk-MK');
    const fmtDate = (iso: string | null) => {
      if (!iso) return '—';
      const d = new Date(iso);
      return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
    };

    const rows = pr.interventions.map(i =>
      `<tr><td>${fmtDate(i.performedAt)}</td><td>${i.name}</td><td>${i.teeth.join(', ') || '—'}</td>
       <td class="num">${fmt(i.price)}</td><td class="num">${fmt(i.paidAmount)}</td>
       <td class="num${i.outstanding > 0 ? ' debt' : ''}">${fmt(i.outstanding)}</td></tr>`
    ).join('');

    this.openPrintWindow(
      `Финансиски извештај — ${pr.patientName}`,
      `<div class="summary">
        <div class="summary-item"><span class="summary-label">Вкупно наплатено</span><span class="summary-value">${fmt(pr.totalBilled)} ден</span></div>
        <div class="summary-item"><span class="summary-label">Платено</span><span class="summary-value paid">${fmt(pr.totalPaid)} ден</span></div>
        <div class="summary-item"><span class="summary-label">Долг</span><span class="summary-value${pr.totalOutstanding > 0 ? ' debt' : ''}">${fmt(pr.totalOutstanding)} ден</span></div>
      </div>
      ${rows ? `<table>
        <thead><tr><th>Датум</th><th>Интервенција</th><th>Заби</th><th class="num">Цена</th><th class="num">Платено</th><th class="num">Долг</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="3"><strong>Вкупно</strong></td>
          <td class="num"><strong>${fmt(pr.totalBilled)}</strong></td>
          <td class="num"><strong>${fmt(pr.totalPaid)}</strong></td>
          <td class="num${pr.totalOutstanding > 0 ? ' debt' : ''}"><strong>${fmt(pr.totalOutstanding)}</strong></td>
        </tr></tfoot>
      </table>` : '<p>Нема интервенции</p>'}`
    );
  }

  private openPrintWindow(title: string, body: string): void {
    const now = new Date();
    const fmtNow = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #222; font-size: 13px; }
  h1 { font-size: 18px; font-weight: 600; margin-bottom: 2px; }
  h3 { font-size: 14px; font-weight: 600; margin: 20px 0 8px; }
  .subtitle { font-size: 11px; color: #666; margin-bottom: 20px; }
  .total { font-size: 14px; margin-bottom: 16px; }
  .summary { display: flex; gap: 32px; margin-bottom: 20px; }
  .summary-item { display: flex; flex-direction: column; }
  .summary-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; }
  .summary-value { font-size: 18px; font-weight: 600; }
  .summary-value.paid { color: #2e7d32; }
  .summary-value.debt { color: #c62828; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #f5f5f5; text-align: left; padding: 8px 10px; border-bottom: 2px solid #ddd;
       font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; color: #555; }
  td { padding: 7px 10px; border-bottom: 1px solid #eee; }
  tr:last-child td { border-bottom: none; }
  .num { text-align: right; }
  th.num { text-align: right; }
  .debt { color: #c62828; font-weight: 500; }
  tfoot td { border-top: 2px solid #ddd; font-weight: 600; padding-top: 10px; }
</style>
</head><body>
<h1>${title}</h1>
<p class="subtitle">Печатено: ${fmtNow}</p>
${body}
<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  }

  // ── Patient search ────────────────────────────────────────────────────────

  onPatientSearch(query: string): void {
    this.patientQuery.set(query);
    if (query.length < 2) {
      this.patientSearchResults.set([]);
      return;
    }
    this.searchSubject.next(query);
  }

  selectPatient(p: Patient): void {
    this.patientQuery.set(`${p.firstName} ${p.lastName}`);
    this.patientSearchResults.set([]);
    this.reportSvc.patientReport(p.id).subscribe(r => this.patientReport.set(r));
  }

  private loadOutstanding(): void {
    this.reportSvc.outstanding().subscribe(list => this.outstandingList.set(list));
  }

  apToggleSort(col: string): void {
    const field = col === 'patient' ? 'name' : col;
    if (this.apSort() === field) {
      this.apDir.set(this.apDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.apSort.set(field);
      this.apDir.set(field === 'date' ? 'desc' : 'asc');
    }
    this.loadAllPatients();
  }

  onApQueryChange(value: string): void {
    this.apQuery.set(value);
    this.apSearchSubject.next(value);
  }

  apApplyDateFilter(): void {
    this.loadAllPatients();
  }

  apClearFilters(): void {
    this.apFrom.set('');
    this.apTo.set('');
    this.apQuery.set('');
    this.apSort.set('name');
    this.apDir.set('asc');
    this.loadAllPatients();
  }

  private loadAllPatients(): void {
    const params: Record<string, string> = {};
    if (this.apFrom()) params['from'] = this.apFrom();
    if (this.apTo()) params['to'] = this.apTo();
    if (this.apQuery()) params['q'] = this.apQuery();
    if (this.apSort() !== 'name') params['sort'] = this.apSort();
    if (this.apDir() !== 'asc') params['dir'] = this.apDir();
    this.reportSvc.patientsSummary(params).subscribe({
      next: list => this.allPatientsList.set(list),
      error: err => console.error('patients-summary error:', err),
    });
  }

  // ── Excel exports ─────────────────────────────────────────────────────────

  exportExcel(): void {
    const d = this.data();
    const wb = XLSX.utils.book_new();

    const summaryData = [
      ['Извештај', this.rangeLabel()],
      [],
      ['Приход', d.revenue],
      ['Неплатено', d.outstanding],
      ['Завршени средби', d.appointmentCount],
      ['Интервенции', d.interventionCount],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Резиме');

    if (d.revenueByType.length > 0) {
      const typeData = [
        ['Интервенција', 'Износ'],
        ...d.revenueByType.map(r => [r.name, r.amount]),
      ];
      const typeWs = XLSX.utils.aoa_to_sheet(typeData);
      XLSX.utils.book_append_sheet(wb, typeWs, 'По интервенција');
    }

    if (d.paymentMethodBreakdown.length > 0) {
      const payData = [
        ['Начин', 'Износ'],
        ...d.paymentMethodBreakdown.map(p => [p.label, p.amount]),
      ];
      const payWs = XLSX.utils.aoa_to_sheet(payData);
      XLSX.utils.book_append_sheet(wb, payWs, 'По начин на плаќање');
    }

    XLSX.writeFile(wb, `извештај-${this.rangeLabel()}.xlsx`);
  }

  exportOutstandingExcel(): void {
    const list = this.outstandingList();
    if (list.length === 0) return;
    const data = [
      ['Пациент', 'Наплатено', 'Платено', 'Долг'],
      ...list.map(o => [o.patientName, o.totalBilled, o.totalPaid, o.outstanding]),
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Неплатени');
    XLSX.writeFile(wb, 'неплатени-пациенти.xlsx');
  }

  exportAllPatientsExcel(): void {
    const list = this.allPatientsList();
    if (list.length === 0) return;
    const data = [
      ['Пациент', 'Наплатено', 'Платено', 'Долг'],
      ...list.map(o => [o.patientName, o.totalBilled, o.totalPaid, o.outstanding]),
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Сите пациенти');
    XLSX.writeFile(wb, 'сите-пациенти-финансии.xlsx');
  }

  exportPatientExcel(): void {
    const pr = this.patientReport();
    if (!pr) return;
    const wb = XLSX.utils.book_new();

    const summaryData = [
      ['Пациент', pr.patientName],
      [],
      ['Вкупно наплатено', pr.totalBilled],
      ['Платено', pr.totalPaid],
      ['Долг', pr.totalOutstanding],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Резиме');

    if (pr.interventions.length > 0) {
      const intData = [
        ['Датум', 'Интервенција', 'Заби', 'Цена', 'Платено', 'Долг'],
        ...pr.interventions.map(i => [
          i.performedAt ? new Date(i.performedAt).toLocaleDateString('mk') : '—',
          i.name,
          i.teeth.join(', ') || '—',
          i.price,
          i.paidAmount,
          i.outstanding,
        ]),
      ];
      const intWs = XLSX.utils.aoa_to_sheet(intData);
      XLSX.utils.book_append_sheet(wb, intWs, 'Интервенции');
    }

    XLSX.writeFile(wb, `извештај-${pr.patientName}.xlsx`);
  }

  rangeLabel(): string {
    switch (this.range()) {
      case 'today': return 'денес';
      case 'week': return 'недела';
      case 'month': return 'месец';
      case 'custom': return `${this.customFrom()}_${this.customTo()}`;
    }
  }

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
      case 'custom':
        this.loadCustom();
        break;
    }
  }
}
