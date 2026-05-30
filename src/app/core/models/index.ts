export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone: string;
  email?: string;
  address?: string;
  embg?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PatientCreate {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  address?: string;
  embg?: string;
  notes?: string;
}

export interface Allergy {
  id: number;
  name: string;
  severity?: string;
  note?: string;
}

export interface Condition {
  id: number;
  name: string;
  diagnosedAt?: string;
  note?: string;
}

export interface Medication {
  id: number;
  name: string;
  dosage?: string;
  active?: boolean;
}

export interface Appointment {
  id: number;
  patientId: number;
  patientFirstName: string;
  patientLastName: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show';

export interface CatalogItem {
  id: number;
  name: string;
  lastPrice: number;
  usageCount: number;
}

export interface Intervention {
  id: number;
  appointmentId: number;
  catalogId?: number;
  name: string;
  teeth: number[];
  price: number;
  paidAmount: number;
  outstanding: number;
  note?: string;
  performedAt?: string;
  // New: status indicates draft vs completed as per backend workflow
  status: 'DRAFT' | 'COMPLETED';
}

export interface Payment {
  id: number;
  interventionId: number;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  note?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface PatientDocument {
  id: number;
  patientId: number;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  category?: string;
  uploadedAt: string;
}

export interface User {
  username: string;
  name: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ReportData {
  revenue: number;
  outstanding: number;
  appointmentCount: number;
  interventionCount: number;
  revenueByType: { name: string; amount: number }[];
  paymentMethodBreakdown: { method: string; amount: number; label: string }[];
}
