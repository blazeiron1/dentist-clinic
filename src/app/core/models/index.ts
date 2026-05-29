export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  embg?: string;
  dateOfBirth?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
}

export interface Appointment {
  id: string;
  patientId: string;
  dateTime: string;
  durationMinutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  createdAt: string;
}

export type AppointmentStatus = Appointment['status'];

export interface CatalogItem {
  id: string;
  name: string;
  defaultPrice: number;
  category: string;
}

export interface Intervention {
  id: string;
  appointmentId: string;
  catalogItemId?: string;
  name: string;
  teeth: number[];
  price: number;
  paidAmount: number;
  notes?: string;
}

export interface Payment {
  id: string;
  interventionId: string;
  amount: number;
  method: 'cash' | 'card' | 'transfer';
  date: string;
}

export type PaymentMethod = Payment['method'];

export interface PatientDocument {
  id: string;
  patientId: string;
  name: string;
  type: 'image' | 'pdf';
  url: string;
  size?: number;
  uploadedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'dentist' | 'receptionist';
}
