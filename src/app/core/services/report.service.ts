import { Injectable, inject } from '@angular/core';
import { AppointmentService } from './appointment.service';
import { InterventionService } from './intervention.service';
import { PaymentService } from './payment.service';

export interface ReportData {
  revenue: number;
  outstanding: number;
  appointmentCount: number;
  interventionCount: number;
  revenueByType: { name: string; amount: number }[];
  paymentMethodBreakdown: { method: string; amount: number; label: string }[];
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private apptSvc = inject(AppointmentService);
  private intSvc = inject(InterventionService);
  private paySvc = inject(PaymentService);

  compute(from: Date, to: Date): ReportData {
    const appts = this.apptSvc.byDateRange(from, to);
    const apptIds = new Set(appts.map(a => a.id));
    const interventions = this.intSvc.interventions().filter(i => apptIds.has(i.appointmentId));
    const iIds = new Set(interventions.map(i => i.id));
    const payments = this.paySvc.payments().filter(p => iIds.has(p.interventionId));

    const revenue = payments.reduce((s, p) => s + p.amount, 0);
    const outstanding = interventions.reduce((s, i) => s + (i.price - i.paidAmount), 0);

    // Revenue by intervention name
    const byType = new Map<string, number>();
    for (const i of interventions) {
      byType.set(i.name, (byType.get(i.name) ?? 0) + i.paidAmount);
    }
    const revenueByType = [...byType.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    // Payment method breakdown
    const byMethod = new Map<string, number>();
    for (const p of payments) {
      byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + p.amount);
    }
    const methodLabels: Record<string, string> = { cash: 'Готовина', card: 'Картичка', transfer: 'Трансфер' };
    const paymentMethodBreakdown = [...byMethod.entries()]
      .map(([method, amount]) => ({ method, amount, label: methodLabels[method] ?? method }));

    return { revenue, outstanding, appointmentCount: appts.length, interventionCount: interventions.length, revenueByType, paymentMethodBreakdown };
  }
}
