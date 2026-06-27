# UX Improvements Plan

## Priority 1 - Critical (Implement First)

### 1.1 Form Validation - Real-Time Feedback (All Forms)
**Files:** `patient-new.component.ts/html`, `new-appointment-dialog.component.ts/html`, `payment-dialog.component.ts/html`

- [ ] Add Angular reactive forms with real-time validation (replace template-driven where needed)
- [ ] Show `<mat-error>` messages on touched/dirty invalid fields
- [ ] Disable Save/Submit button when form is invalid
- [ ] Add phone format hint (e.g., "+389 XX XXX XXX")
- [ ] Add date-of-birth range validation (no future dates)
- [ ] Payment dialog: real-time validation if amount > outstanding, show error immediately

### 1.2 Intervention Draft State - Clarity
**Files:** `appointment-detail.component.ts/html`

- [ ] Show "unsaved changes" warning banner when draft intervention exists
- [ ] Reorder fields: Name -> Price -> Teeth -> Notes
- [ ] Show confirmation when catalog selection overrides a manually entered price
- [ ] Add loading spinner on intervention save button during submission

### 1.3 Patient List - Surface Key Info
**Files:** `patient-list.component.ts/html`, BE: `PatientController`, `PatientDto`

- [ ] Add "Outstanding Balance" column to patient list table
- [ ] Add "Last Visit" column to patient list table
- [ ] Remove redundant action icon button (row is already clickable)
- [ ] BE: extend patient list DTO to include balance and last visit date

### 1.4 Payment Dialog - Clear UX
**Files:** `payment-dialog.component.ts/html`

- [ ] Move "Max amount" hint above the input field
- [ ] Clear default amount field (let user type fresh, show outstanding as hint only)
- [ ] Add real-time validation with red border if amount exceeds outstanding
- [ ] Add short tooltip on each payment method (CASH/CARD/TRANSFER)

---

## Priority 2 - Major (Implement Second)

### 2.1 Calendar View Toggle - Preserve Context
**Files:** `calendar.component.ts/html`

- [ ] Preserve selected date when switching between week/day views
- [ ] Show current date range in toolbar (e.g., "13 - 19 Jan 2025")
- [ ] Show appointment end time in real-time when adjusting duration in new-appointment dialog

### 2.2 Appointment Status Changes - Add Confirmation
**Files:** `appointment-detail.component.ts/html`

- [ ] Add Material confirmation dialog before Cancel / No-Show status changes
- [ ] Replace conditional button group with a single `<mat-select>` status dropdown

### 2.3 Reports - Streamline
**Files:** `reports.component.ts/html`, BE: `ReportController`, `ReportService`

- [ ] Add preset date range buttons ("Today", "This Week", "This Month", "This Quarter")
- [ ] Add consistent filtering across all tabs (patient name, date range)
- [ ] Unify export button placement (top-right of each tab, same position)
- [ ] Cache report data within session to avoid re-fetch on tab switch

### 2.4 Loading States
**Files:** `calendar.component.ts/html`, `patient-list.component.ts/html`, `appointment-detail.component.ts/html`

- [ ] Add `@if (loading())` spinner/skeleton for calendar data load
- [ ] Add spinner for patient list initial load
- [ ] Add spinner for appointment detail load

---

## Priority 3 - Moderate (Implement Third)

### 3.1 Tooth Chart Usability
**Files:** `tooth-chart.component.ts/html`

- [ ] Increase SVG tooth touch targets (min 44px for mobile)
- [ ] Remove hover/pointer styles in readonly mode
- [ ] Add selected teeth summary text below chart (e.g., "Selected: 16, 17, 18")
- [ ] Add "Clear all" button when in edit mode

### 3.2 Medical History - Reduce Repetition
**Files:** `patient-detail.component.ts/html`

- [ ] Add duplicate detection when adding allergy/condition/medication
- [ ] Add inline edit (click item text to edit, Enter to save)
- [ ] Optionally: extract reusable `<app-tag-list>` component for all three sections

### 3.3 Standardize Date Formats
**Files:** All components using `| date` pipe

- [ ] Define standard date formats as constants in a shared file
  - Short: `dd.MM.yyyy`
  - With time: `dd.MM.yyyy HH:mm`
  - Full: `EEEE, dd MMMM yyyy - HH:mm`
- [ ] Replace all inline format strings with the constants

### 3.4 Snackbar Consistency
**Files:** All components using `MatSnackBar`

- [ ] Standardize duration to 3000ms for all snackbar notifications
- [ ] Use consistent positioning (bottom-center)

### 3.5 Navigation Improvements
**Files:** `shell.component.ts/html`

- [ ] Highlight parent route when on child routes (e.g., highlight Calendar when on /appointments/:id)
- [ ] Add breadcrumb on detail pages (Calendar > Appointment #123)
- [ ] Add quick-action buttons: "New Appointment", "New Patient" in sidebar

---

## Out of Scope (Deferred)
- Appointment time conflict detection (requires BE endpoint)
- Bulk patient selection / bulk actions
- Cloud backup integration
- Calendar visual month-grid picker replacement
- Catalog search "no results" feedback
- Intervention catalog category/type display
