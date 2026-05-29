import {
  Component, inject, signal, computed, OnInit, ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { AppointmentService } from '../../core/services/appointment.service';
import { PatientService } from '../../core/services/patient.service';
import { Appointment } from '../../core/models';
import { NewAppointmentDialogComponent } from './new-appointment-dialog/new-appointment-dialog.component';

export type CalendarView = 'week' | 'day';

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#1976d2',
  completed: '#388e3c',
  cancelled: '#757575',
  'no-show': '#f57c00',
};

interface CalendarAppt {
  appt: Appointment;
  patientName: string;
  color: string;
  top: string;
  height: string;
  col: number; // 0-6 for week, ignored for day
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatIconModule, MatTooltipModule, MatChipsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent implements OnInit {
  private apptSvc = inject(AppointmentService);
  private patientSvc = inject(PatientService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  view = signal<CalendarView>('week');
  anchorDate = signal(new Date()); // start of current week/day

  readonly hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8..19
  readonly slotHeight = 60; // px per hour

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
    const from = days[0];
    const to = new Date(days[6]);
    to.setHours(23, 59, 59);

    return this.apptSvc.byDateRange(from, to).map(appt => {
      const patient = this.patientSvc.getById(appt.patientId);
      const dt = new Date(appt.dateTime);
      const dayIdx = days.findIndex(d => d.toDateString() === dt.toDateString());
      const minuteFromEight = (dt.getHours() - 8) * 60 + dt.getMinutes();
      const top = (minuteFromEight / 60) * this.slotHeight;
      const height = Math.max((appt.durationMinutes / 60) * this.slotHeight - 2, 20);
      return {
        appt,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
        color: STATUS_COLORS[appt.status],
        top: top + 'px',
        height: height + 'px',
        col: dayIdx,
      };
    }).filter(a => a.col >= 0);
  });

  dayAppts = computed<CalendarAppt[]>(() => {
    const d = this.anchorDate();
    const from = new Date(d); from.setHours(0, 0, 0);
    const to = new Date(d); to.setHours(23, 59, 59);
    return this.apptSvc.byDateRange(from, to).map(appt => {
      const patient = this.patientSvc.getById(appt.patientId);
      const dt = new Date(appt.dateTime);
      const minuteFromEight = (dt.getHours() - 8) * 60 + dt.getMinutes();
      const top = (minuteFromEight / 60) * this.slotHeight;
      const height = Math.max((appt.durationMinutes / 60) * this.slotHeight - 2, 20);
      return { appt, patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
        color: STATUS_COLORS[appt.status], top: top + 'px', height: height + 'px', col: 0 };
    });
  });

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
      if (result) this.apptSvc.add(result);
    });
  }

  openAppt(appt: Appointment, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/appointments', appt.id]);
  }

  isToday(d: Date): boolean {
    return d.toDateString() === new Date().toDateString();
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
  readonly statusList = [
    { key: 'scheduled', label: 'Закажана', color: '#1976d2' },
    { key: 'completed', label: 'Завршена', color: '#388e3c' },
    { key: 'cancelled', label: 'Откажана', color: '#757575' },
    { key: 'no-show', label: 'Не се јавил', color: '#f57c00' },
  ];
}
