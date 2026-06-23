import {
  Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, effect, untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { OverlayModule, ConnectedPosition } from '@angular/cdk/overlay';
import { AppointmentService } from '../../core/services/appointment.service';
import { Appointment } from '../../core/models';
import { STATUS_COLORS, APPOINTMENT_STATUSES } from '../../core/constants';
import { NewAppointmentDialogComponent } from './new-appointment-dialog/new-appointment-dialog.component';

export type CalendarView = 'week' | 'day';

interface CalendarAppt {
  appt: Appointment;
  patientName: string;
  color: string;
  top: string;
  height: string;
  col: number;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatIconModule, MatTooltipModule, MatChipsModule, MatDividerModule, OverlayModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent implements OnInit {
  private apptSvc = inject(AppointmentService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  view = signal<CalendarView>('week');
  anchorDate = signal(new Date());
  showPicker = signal(false);
  private _appointments = signal<Appointment[]>([]);

  readonly pickerPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
  ];

  readonly hours = Array.from({ length: 12 }, (_, i) => i + 8);
  readonly slotHeight = 60;

  readonly months = [
    { value: 0,  label: 'Јануари' },
    { value: 1,  label: 'Февруари' },
    { value: 2,  label: 'Март' },
    { value: 3,  label: 'Април' },
    { value: 4,  label: 'Мај' },
    { value: 5,  label: 'Јуни' },
    { value: 6,  label: 'Јули' },
    { value: 7,  label: 'Август' },
    { value: 8,  label: 'Септември' },
    { value: 9,  label: 'Октомври' },
    { value: 10, label: 'Ноември' },
    { value: 11, label: 'Декември' },
  ];

  selectedMonth = computed(() => this.anchorDate().getMonth());
  selectedYear  = computed(() => this.anchorDate().getFullYear());
  dateLabel     = computed(() => `${this.months[this.selectedMonth()].label} ${this.selectedYear()}`);

  togglePicker(): void {
    this.showPicker.update(v => !v);
  }

  onOverlayOutsideClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('.date-picker-trigger')) return;
    this.showPicker.set(false);
  }

  selectMonth(month: number): void {
    this.goToMonthYear(month, this.selectedYear());
    this.showPicker.set(false);
  }

  onYearSelect(year: number): void {
    this.goToMonthYear(this.selectedMonth(), year);
  }

  private goToMonthYear(month: number, year: number): void {
    const d = new Date(year, month, 1);
    if (this.view() === 'week') {
      const day = d.getDay();
      const daysToMonday = day === 1 ? 0 : day === 0 ? 1 : 8 - day;
      d.setDate(d.getDate() + daysToMonday);
    }
    this.anchorDate.set(d);
  }

  weekDays = computed(() => {
    const monday = this.getMonday(this.anchorDate());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return d;
    });
  });

  calendarAppts = computed<CalendarAppt[]>(() => {
    const days = this.weekDays();
    return this._appointments().map(appt => {
      const dt = new Date(appt.startsAt);
      const endDt = new Date(appt.endsAt);
      const durationMin = (endDt.getTime() - dt.getTime()) / 60000;
      const dayIdx = days.findIndex(d => d.toDateString() === dt.toDateString());
      const minuteFromEight = (dt.getHours() - 8) * 60 + dt.getMinutes();
      const top = (minuteFromEight / 60) * this.slotHeight;
      const height = Math.max((durationMin / 60) * this.slotHeight - 2, 20);
      return {
        appt,
        patientName: `${appt.patientFirstName} ${appt.patientLastName}`,
        color: STATUS_COLORS[appt.status] ?? '#757575',
        top: top + 'px',
        height: height + 'px',
        col: dayIdx,
      };
    }).filter(a => a.col >= 0);
  });

  dayAppts = computed<CalendarAppt[]>(() => {
    return this._appointments().map(appt => {
      const dt = new Date(appt.startsAt);
      const endDt = new Date(appt.endsAt);
      const durationMin = (endDt.getTime() - dt.getTime()) / 60000;
      const minuteFromEight = (dt.getHours() - 8) * 60 + dt.getMinutes();
      const top = (minuteFromEight / 60) * this.slotHeight;
      const height = Math.max((durationMin / 60) * this.slotHeight - 2, 20);
      return {
        appt,
        patientName: `${appt.patientFirstName} ${appt.patientLastName}`,
        color: STATUS_COLORS[appt.status] ?? '#757575',
        top: top + 'px',
        height: height + 'px',
        col: 0,
      };
    });
  });

  private durationOf(appt: Appointment): number {
    return Math.round((new Date(appt.endsAt).getTime() - new Date(appt.startsAt).getTime()) / 60000);
  }

  constructor() {
    effect(() => {
      const _v = this.view();
      const _a = this.anchorDate();
      untracked(() => this.loadAppointments());
    });
  }

  ngOnInit(): void {
    this.anchorDate.set(this.getMonday(new Date()));
  }

  prev(): void {
    const d = new Date(this.anchorDate());
    d.setDate(d.getDate() - (this.view() === 'week' ? 7 : 1));
    this.anchorDate.set(d);
  }

  next(): void {
    const d = new Date(this.anchorDate());
    d.setDate(d.getDate() + (this.view() === 'week' ? 7 : 1));
    this.anchorDate.set(d);
  }

  today(): void {
    this.anchorDate.set(this.view() === 'week' ? this.getMonday(new Date()) : new Date());
  }

  setView(v: CalendarView): void {
    this.view.set(v);
    if (v === 'day') this.anchorDate.set(new Date());
    else this.anchorDate.set(this.getMonday(new Date()));
  }

  openNewAppt(dayIndex: number, hour: number): void {
    const day = this.view() === 'week' ? this.weekDays()[dayIndex] : this.anchorDate();
    const dateTime = new Date(day);
    dateTime.setHours(hour, 0, 0, 0);
    const ref = this.dialog.open(NewAppointmentDialogComponent, {
      width: '460px',
      data: { dateTime },
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.apptSvc.create(result).subscribe(() => this.loadAppointments());
      }
    });
  }

  openAppt(appt: Appointment, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/appointments', appt.id]);
  }

  isToday(d: Date): boolean {
    return d.toDateString() === new Date().toDateString();
  }

  getTooltip(ca: CalendarAppt): string {
    return `${ca.patientName} – ${this.durationOf(ca.appt)} мин`;
  }

  private loadAppointments(): void {
    let from: Date, to: Date;
    if (this.view() === 'week') {
      const days = this.weekDays();
      from = days[0];
      to = new Date(days[6]);
      to.setHours(23, 59, 59, 999);
    } else {
      from = new Date(this.anchorDate());
      from.setHours(0, 0, 0, 0);
      to = new Date(this.anchorDate());
      to.setHours(23, 59, 59, 999);
    }
    this.apptSvc.findByRange(from, to).subscribe(appts => {
      this._appointments.set(appts);
    });
  }

  private getMonday(d: Date): Date {
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  protected readonly statusColors = STATUS_COLORS;
  readonly statusList = APPOINTMENT_STATUSES;
}
