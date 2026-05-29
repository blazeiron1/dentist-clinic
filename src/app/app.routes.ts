import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'calendar', pathMatch: 'full' },
      {
        path: 'calendar',
        loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent),
      },
      {
        path: 'patients',
        loadComponent: () => import('./features/patients/patient-list/patient-list.component').then(m => m.PatientListComponent),
      },
      {
        path: 'patients/new',
        loadComponent: () => import('./features/patients/patient-new/patient-new.component').then(m => m.PatientNewComponent),
      },
      {
        path: 'patients/:id',
        loadComponent: () => import('./features/patients/patient-detail/patient-detail.component').then(m => m.PatientDetailComponent),
      },
      {
        path: 'appointments/:id',
        loadComponent: () => import('./features/appointments/appointment-detail/appointment-detail.component').then(m => m.AppointmentDetailComponent),
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
