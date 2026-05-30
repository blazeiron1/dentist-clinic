import { AppointmentStatus, PaymentMethod } from './models';

export interface StatusConfig {
  key: AppointmentStatus;
  label: string;
  color: string;
  matColor: string;
}

export const APPOINTMENT_STATUSES: StatusConfig[] = [
  { key: 'scheduled', label: 'Закажана', color: '#1976d2', matColor: 'primary' },
  { key: 'completed', label: 'Завршена', color: '#388e3c', matColor: 'accent' },
  { key: 'cancelled', label: 'Откажана', color: '#757575', matColor: '' },
  { key: 'no-show', label: 'Не дојде', color: '#f57c00', matColor: 'warn' },
];

export const STATUS_LABELS: Record<string, string> =
  Object.fromEntries(APPOINTMENT_STATUSES.map(s => [s.key, s.label]));

export const STATUS_COLORS: Record<string, string> =
  Object.fromEntries(APPOINTMENT_STATUSES.map(s => [s.key, s.color]));

export const STATUS_MAT_COLORS: Record<string, string> =
  Object.fromEntries(APPOINTMENT_STATUSES.map(s => [s.key, s.matColor]));

export interface PaymentMethodConfig {
  key: PaymentMethod;
  label: string;
}

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  { key: 'cash', label: 'Готовина' },
  { key: 'card', label: 'Картичка' },
  { key: 'transfer', label: 'Трансфер' },
];

export const PAYMENT_METHOD_LABELS: Record<string, string> =
  Object.fromEntries(PAYMENT_METHODS.map(m => [m.key, m.label]));

export const PAYMENT_METHOD_LABELS_BE: Record<string, string> =
  Object.fromEntries(PAYMENT_METHODS.map(m => [m.key.toUpperCase(), m.label]));

export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

export const INTERVENTION_COLORS = [
  '#e53935', '#8e24aa', '#1e88e5', '#00897b',
  '#f4511e', '#3949ab', '#039be5', '#43a047',
];
