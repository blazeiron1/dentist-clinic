import { Appointment, CatalogItem, Intervention, Patient, Payment, PatientDocument } from '../models';

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p1', firstName: 'Marija', lastName: 'Petrova', phone: '070 123 456',
    email: 'marija.petrova@gmail.com', embg: '0504985455001',
    dateOfBirth: '1985-04-05', address: 'ul. Partizanska 12, Skopje',
    createdAt: '2024-01-15T10:00:00Z',
    allergies: ['Penicillin'], conditions: ['Diabetes type 2'], medications: ['Metformin 500mg'],
  },
  {
    id: 'p2', firstName: 'Aleksandar', lastName: 'Nikolov', phone: '071 234 567',
    email: 'alex.nikolov@yahoo.com', embg: '1209780451003',
    dateOfBirth: '1980-09-12', address: 'ul. Jane Sandanski 5, Skopje',
    createdAt: '2024-02-20T09:00:00Z',
    allergies: [], conditions: ['Hypertension'], medications: ['Amlodipine 5mg'],
  },
  {
    id: 'p3', firstName: 'Elena', lastName: 'Stojanova', phone: '072 345 678',
    email: 'elena.stojanova@mail.com', embg: '2807992455002',
    dateOfBirth: '1992-07-28', address: 'ul. Kej Dimitar Vlahov 3, Skopje',
    createdAt: '2024-03-10T11:00:00Z',
    allergies: ['Latex', 'Aspirin'], conditions: [], medications: [],
  },
  {
    id: 'p4', firstName: 'Bojan', lastName: 'Gjorgjevski', phone: '075 456 789',
    dateOfBirth: '1975-03-15', address: 'ul. Marshal Tito 22, Bitola',
    createdAt: '2024-04-05T08:30:00Z',
    allergies: [], conditions: ['Asthma'], medications: ['Ventolin inhaler'],
  },
  {
    id: 'p5', firstName: 'Sonja', lastName: 'Ilievska', phone: '078 567 890',
    email: 'sonja.ilievska@gmail.com', embg: '1606988455001',
    dateOfBirth: '1988-06-16', address: 'ul. Vasil Gjorgov 8, Skopje',
    createdAt: '2024-05-12T14:00:00Z',
    allergies: [], conditions: [], medications: [],
  },
  {
    id: 'p6', firstName: 'Nikola', lastName: 'Trajkovski', phone: '076 678 901',
    email: 'nikola.trajkovski@hotmail.com',
    dateOfBirth: '1995-11-23', address: 'ul. Blvd. Ilinden 45, Skopje',
    createdAt: '2024-06-18T16:00:00Z',
    allergies: ['Codeine'], conditions: [], medications: [],
  },
  {
    id: 'p7', firstName: 'Ana', lastName: 'Kostadinovska', phone: '070 789 012',
    dateOfBirth: '2000-02-10',
    createdAt: '2024-07-22T10:30:00Z',
    allergies: [], conditions: [], medications: [],
  },
  {
    id: 'p8', firstName: 'Dragan', lastName: 'Mitrevski', phone: '071 890 123',
    email: 'dragan.m@work.com', embg: '0505965451002',
    dateOfBirth: '1965-05-05', address: 'ul. Orce Nikolov 18, Skopje',
    createdAt: '2024-08-30T09:15:00Z',
    allergies: [], conditions: ['Diabetes type 1', 'Hypertension'], medications: ['Insulin', 'Ramipril 5mg'],
  },
];

// Appointments: spread across this week + last 2 weeks
// Today: 2026-05-29 (Thursday). Week: May 25–31
const D = (d: string) => d; // passthrough for readability

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'a1', patientId: 'p1', dateTime: '2026-05-25T09:00:00', durationMinutes: 60, status: 'completed', createdAt: '2026-05-20T10:00:00Z' },
  { id: 'a2', patientId: 'p2', dateTime: '2026-05-25T11:00:00', durationMinutes: 30, status: 'completed', createdAt: '2026-05-20T11:00:00Z' },
  { id: 'a3', patientId: 'p3', dateTime: '2026-05-26T10:00:00', durationMinutes: 90, status: 'completed', createdAt: '2026-05-21T09:00:00Z' },
  { id: 'a4', patientId: 'p4', dateTime: '2026-05-26T14:00:00', durationMinutes: 60, status: 'no-show', createdAt: '2026-05-21T10:00:00Z' },
  { id: 'a5', patientId: 'p5', dateTime: '2026-05-27T09:30:00', durationMinutes: 45, status: 'completed', notes: 'Regular checkup', createdAt: '2026-05-22T08:00:00Z' },
  { id: 'a6', patientId: 'p6', dateTime: '2026-05-27T11:00:00', durationMinutes: 60, status: 'completed', createdAt: '2026-05-22T09:00:00Z' },
  { id: 'a7', patientId: 'p1', dateTime: '2026-05-28T10:00:00', durationMinutes: 90, status: 'completed', createdAt: '2026-05-23T10:00:00Z' },
  { id: 'a8', patientId: 'p7', dateTime: '2026-05-29T09:00:00', durationMinutes: 60, status: 'scheduled', createdAt: '2026-05-24T11:00:00Z' },
  { id: 'a9', patientId: 'p2', dateTime: '2026-05-29T10:30:00', durationMinutes: 30, status: 'scheduled', notes: 'Follow-up after extraction', createdAt: '2026-05-24T12:00:00Z' },
  { id: 'a10', patientId: 'p8', dateTime: '2026-05-29T13:00:00', durationMinutes: 60, status: 'scheduled', createdAt: '2026-05-24T13:00:00Z' },
  { id: 'a11', patientId: 'p3', dateTime: '2026-05-30T09:00:00', durationMinutes: 120, status: 'scheduled', notes: 'Crown fitting', createdAt: '2026-05-25T09:00:00Z' },
  { id: 'a12', patientId: 'p5', dateTime: '2026-05-30T14:00:00', durationMinutes: 60, status: 'scheduled', createdAt: '2026-05-25T10:00:00Z' },
  { id: 'a13', patientId: 'p6', dateTime: '2026-05-31T10:00:00', durationMinutes: 45, status: 'scheduled', createdAt: '2026-05-26T09:00:00Z' },
  { id: 'a14', patientId: 'p4', dateTime: '2026-06-01T09:00:00', durationMinutes: 60, status: 'scheduled', createdAt: '2026-05-26T10:00:00Z' },
  // Past appointments
  { id: 'a15', patientId: 'p1', dateTime: '2026-05-18T10:00:00', durationMinutes: 90, status: 'completed', createdAt: '2026-05-15T09:00:00Z' },
  { id: 'a16', patientId: 'p8', dateTime: '2026-05-19T11:00:00', durationMinutes: 60, status: 'completed', createdAt: '2026-05-16T10:00:00Z' },
  { id: 'a17', patientId: 'p7', dateTime: '2026-05-20T09:00:00', durationMinutes: 30, status: 'cancelled', createdAt: '2026-05-17T11:00:00Z' },
];

export const MOCK_CATALOG: CatalogItem[] = [
  { id: 'c1', name: 'Преглед', defaultPrice: 500, category: 'Дијагностика' },
  { id: 'c2', name: 'Рендген', defaultPrice: 300, category: 'Дијагностика' },
  { id: 'c3', name: 'Полнење композит', defaultPrice: 2000, category: 'Конзервативна' },
  { id: 'c4', name: 'Полнење амалгам', defaultPrice: 1200, category: 'Конзервативна' },
  { id: 'c5', name: 'Екстракција', defaultPrice: 1000, category: 'Хирургија' },
  { id: 'c6', name: 'Екстракција - компликована', defaultPrice: 2000, category: 'Хирургија' },
  { id: 'c7', name: 'Девитализација', defaultPrice: 2500, category: 'Ендодонтска' },
  { id: 'c8', name: 'Ендодонтски третман', defaultPrice: 3500, category: 'Ендодонтска' },
  { id: 'c9', name: 'Круна метало-керамика', defaultPrice: 8000, category: 'Протетика' },
  { id: 'c10', name: 'Круна целокерамика', defaultPrice: 12000, category: 'Протетика' },
  { id: 'c11', name: 'Мост 3 член', defaultPrice: 22000, category: 'Протетика' },
  { id: 'c12', name: 'Избелување (сет)', defaultPrice: 6000, category: 'Естетска' },
  { id: 'c13', name: 'Скалинг и полирање', defaultPrice: 1500, category: 'Превентива' },
  { id: 'c14', name: 'Флуоридација', defaultPrice: 500, category: 'Превентива' },
  { id: 'c15', name: 'Анестезија', defaultPrice: 300, category: 'Останато' },
  { id: 'c16', name: 'Хируршка екстракција мудрец', defaultPrice: 3000, category: 'Хирургија' },
  { id: 'c17', name: 'Импресија', defaultPrice: 800, category: 'Протетика' },
  { id: 'c18', name: 'Привремена круна', defaultPrice: 1500, category: 'Протетика' },
  { id: 'c19', name: 'Ортодонтска консултација', defaultPrice: 500, category: 'Ортодонтска' },
  { id: 'c20', name: 'Фотополимерна плоча', defaultPrice: 4000, category: 'Ортодонтска' },
];

export const MOCK_INTERVENTIONS: Intervention[] = [
  // a1 - Marija's completed appointment
  { id: 'i1', appointmentId: 'a1', catalogItemId: 'c1', name: 'Преглед', teeth: [], price: 500, paidAmount: 500 },
  { id: 'i2', appointmentId: 'a1', catalogItemId: 'c2', name: 'Рендген', teeth: [16, 17], price: 300, paidAmount: 300 },
  { id: 'i3', appointmentId: 'a1', catalogItemId: 'c3', name: 'Полнење композит', teeth: [16], price: 2000, paidAmount: 2000 },
  // a2 - Aleksandar completed
  { id: 'i4', appointmentId: 'a2', catalogItemId: 'c1', name: 'Преглед', teeth: [], price: 500, paidAmount: 500 },
  { id: 'i5', appointmentId: 'a2', catalogItemId: 'c13', name: 'Скалинг и полирање', teeth: [], price: 1500, paidAmount: 1500 },
  // a3 - Elena long appointment
  { id: 'i6', appointmentId: 'a3', catalogItemId: 'c7', name: 'Девитализација', teeth: [21], price: 2500, paidAmount: 2500 },
  { id: 'i7', appointmentId: 'a3', catalogItemId: 'c8', name: 'Ендодонтски третман', teeth: [21], price: 3500, paidAmount: 1500 },
  // a5 - Sonja checkup
  { id: 'i8', appointmentId: 'a5', catalogItemId: 'c1', name: 'Преглед', teeth: [], price: 500, paidAmount: 500 },
  { id: 'i9', appointmentId: 'a5', catalogItemId: 'c14', name: 'Флуоридација', teeth: [], price: 500, paidAmount: 500 },
  // a6 - Nikola
  { id: 'i10', appointmentId: 'a6', catalogItemId: 'c5', name: 'Екстракција', teeth: [38], price: 1000, paidAmount: 1000 },
  { id: 'i11', appointmentId: 'a6', catalogItemId: 'c15', name: 'Анестезија', teeth: [], price: 300, paidAmount: 300 },
  // a7 - Marija crown prep
  { id: 'i12', appointmentId: 'a7', catalogItemId: 'c17', name: 'Импресија', teeth: [26], price: 800, paidAmount: 800 },
  { id: 'i13', appointmentId: 'a7', catalogItemId: 'c18', name: 'Привремена круна', teeth: [26], price: 1500, paidAmount: 1500 },
  // a8 - Ana today
  { id: 'i14', appointmentId: 'a8', catalogItemId: 'c1', name: 'Преглед', teeth: [], price: 500, paidAmount: 0 },
  // a10 - Dragan today
  { id: 'i15', appointmentId: 'a10', catalogItemId: 'c1', name: 'Преглед', teeth: [], price: 500, paidAmount: 0 },
  { id: 'i16', appointmentId: 'a10', catalogItemId: 'c3', name: 'Полнење композит', teeth: [46], price: 2000, paidAmount: 0 },
  // a15 - Marija older
  { id: 'i17', appointmentId: 'a15', catalogItemId: 'c9', name: 'Круна метало-керамика', teeth: [26], price: 8000, paidAmount: 4000 },
  // a16 - Dragan older
  { id: 'i18', appointmentId: 'a16', catalogItemId: 'c1', name: 'Преглед', teeth: [], price: 500, paidAmount: 500 },
  { id: 'i19', appointmentId: 'a16', catalogItemId: 'c3', name: 'Полнење композит', teeth: [36, 37], price: 4000, paidAmount: 4000 },
];

export const MOCK_PAYMENTS: Payment[] = [
  { id: 'pay1', interventionId: 'i1', amount: 500, method: 'cash', date: '2026-05-25' },
  { id: 'pay2', interventionId: 'i2', amount: 300, method: 'cash', date: '2026-05-25' },
  { id: 'pay3', interventionId: 'i3', amount: 2000, method: 'card', date: '2026-05-25' },
  { id: 'pay4', interventionId: 'i4', amount: 500, method: 'cash', date: '2026-05-25' },
  { id: 'pay5', interventionId: 'i5', amount: 1500, method: 'cash', date: '2026-05-25' },
  { id: 'pay6', interventionId: 'i6', amount: 2500, method: 'card', date: '2026-05-26' },
  { id: 'pay7', interventionId: 'i7', amount: 1500, method: 'cash', date: '2026-05-26' },
  { id: 'pay8', interventionId: 'i8', amount: 500, method: 'cash', date: '2026-05-27' },
  { id: 'pay9', interventionId: 'i9', amount: 500, method: 'cash', date: '2026-05-27' },
  { id: 'pay10', interventionId: 'i10', amount: 1000, method: 'card', date: '2026-05-27' },
  { id: 'pay11', interventionId: 'i11', amount: 300, method: 'card', date: '2026-05-27' },
  { id: 'pay12', interventionId: 'i12', amount: 800, method: 'cash', date: '2026-05-28' },
  { id: 'pay13', interventionId: 'i13', amount: 1500, method: 'cash', date: '2026-05-28' },
  { id: 'pay14', interventionId: 'i17', amount: 4000, method: 'transfer', date: '2026-05-18' },
  { id: 'pay15', interventionId: 'i18', amount: 500, method: 'cash', date: '2026-05-19' },
  { id: 'pay16', interventionId: 'i19', amount: 4000, method: 'card', date: '2026-05-19' },
];

export const MOCK_DOCUMENTS: PatientDocument[] = [
  { id: 'd1', patientId: 'p1', name: 'Pantomogram_2024.jpg', type: 'image', url: 'https://picsum.photos/400/300?random=1', size: 245000, uploadedAt: '2024-01-15T10:30:00Z' },
  { id: 'd2', patientId: 'p1', name: 'Upat_do_ortodont.pdf', type: 'pdf', url: '#', size: 128000, uploadedAt: '2024-03-20T11:00:00Z' },
  { id: 'd3', patientId: 'p3', name: 'Rentgen_16.jpg', type: 'image', url: 'https://picsum.photos/400/300?random=2', size: 189000, uploadedAt: '2026-05-26T10:30:00Z' },
  { id: 'd4', patientId: 'p8', name: 'Laboratorija_2026.pdf', type: 'pdf', url: '#', size: 320000, uploadedAt: '2026-05-19T11:30:00Z' },
];
