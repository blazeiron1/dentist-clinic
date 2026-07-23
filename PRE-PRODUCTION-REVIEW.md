# Pre-Production Review - Dental Clinic FE

**Date:** 2026-07-23
**Reviewer:** Claude Code
**Context:** Single-user inhouse solution (1 user via migration, localhost only)
**Status:** BUG-01 through BUG-09 FIXED — remaining items categorized below

---

## PART 1: BUGS & ISSUES

### FIXED

| Bug | Description | Fix Applied |
|-----|-------------|-------------|
| BUG-01 | Date localization — English day/month names | Registered `mk` locale, added `LOCALE_ID` provider in `app.config.ts` |
| BUG-02 | Patient search fires on every keystroke | Added `Subject` + `debounceTime(300)` in `patient-list.component.ts` |
| BUG-03 | No confirmation before deleting interventions | Added `ConfirmDialogComponent` in `appointment-detail.component.ts` |
| BUG-04 | No confirmation before deleting documents | Added `ConfirmDialogComponent` in `patient-detail.component.ts` |
| BUG-05 | Silent API failures (no error handling) | Added error handlers with `MatSnackBar` in calendar, patient-list, patient-detail, appointment-detail, reports |
| BUG-06 | `console.error` in production code | Replaced with `MatSnackBar` notification in `reports.component.ts` |
| BUG-07 | Session restore crash on corrupted localStorage | Added `try-catch` around `JSON.parse` in `auth.service.ts` |
| BUG-08 | No confirmation for removing allergies/conditions/medications | Added `ConfirmDialogComponent` for all three in `patient-detail.component.ts` |
| BUG-09 | Calendar hours limited to 8:00-19:00 | Extended to 7:00-20:00 (covers appointments up to 21:00). Also fixed BUG-18 (nowMinute reactivity for time indicator) |

---

### MEDIUM - Should fix soon after launch

#### BUG-10: Orphaned `app.html` file with demo content
- **File:** `src/app/app.html`
- **Problem:** Contains a standalone tooth chart demo page. The `App` component uses inline `template: '<router-outlet />'` so this file is never loaded.
- **Fix:** Delete `src/app/app.html`.

#### BUG-11: No unsaved changes guard
- **Problem:** Users can navigate away while editing patient info or having a draft intervention without warning.
- **Fix:** Implement `CanDeactivate` guard or `beforeunload` listener.

#### BUG-12: No loading indicator for patient detail page
- **File:** `patient-detail.component.html:1`
- **Problem:** Before the API responds, the page is blank — no spinner.
- **Fix:** Add a loading state.

#### BUG-13: Package version 0.0.0
- **File:** `package.json:3`
- **Fix:** Set to `1.0.0` before production release.

#### BUG-14: XSS in print functions (negligible risk)
- **Files:** print methods in patient-detail, appointment-detail, reports
- **Problem:** Patient names and notes interpolated directly into HTML without escaping.
- **Risk:** Negligible — single user, trusted data entry, localhost only.

---

### LOW - Nice to have

#### BUG-15: No global error handler
- **Problem:** No custom `ErrorHandler`. Unhandled errors only show in console.
- **Note:** Less critical for single-user inhouse app.

#### BUG-16: No 404 page
- **Problem:** Unknown URLs silently redirect to calendar.

#### BUG-17: Subjects not completed on destroy
- **Files:** `reports.component.ts` (3 Subjects)
- **Problem:** Subjects never `.complete()`-d in `ngOnDestroy`. Minor pattern issue, no actual leak since component is long-lived.

---

## PART 2: TEST SCENARIOS

### A. Authentication Flow

| # | Test Scenario | Steps | Expected Result |
|---|---|---|---|
| A1 | Login with valid credentials | Navigate to /login, enter valid username/password, click "Најави се" | Redirected to /calendar, username shown in sidebar |
| A2 | Login with wrong password | Enter valid username, wrong password | Error message "Погрешни податоци" appears, stays on login |
| A3 | Login with empty fields | Click "Најави се" without entering anything | Validation errors appear |
| A4 | Login button disabled while loading | Enter credentials, click submit | Button shows "Се најавува..." and is disabled until response |
| A5 | Session expiry | Login, manually clear JSESSIONID cookie, try any action | Redirected to /login |
| A6 | Logout | Click user name in sidebar, click "Одјави се" | Redirected to /login, protected routes inaccessible |
| A7 | Direct URL access without login | Open /calendar directly without being logged in | Redirected to /login |
| A8 | Password visibility toggle | Click eye icon next to password field | Password toggles between visible/hidden |
| A9 | Session restore on page refresh | Login, refresh page | User stays logged in, calendar loads normally |

### B. Calendar

| # | Test Scenario | Steps | Expected Result |
|---|---|---|---|
| B1 | Week view loads correctly | Navigate to /calendar | Current week displayed, today highlighted, current time line visible |
| B2 | Navigate between weeks | Click chevron_left / chevron_right arrows | Previous/next week loads with correct appointments |
| B3 | "Today" button | Navigate to a different week, click "Денес" | Returns to current week |
| B4 | Switch to day view | Click "Ден" toggle | Single day view with appointments |
| B5 | Switch back to week view | From day view, click "Недела" | Week view centered on the same week |
| B6 | Create appointment from calendar | Click on an empty time slot | New appointment dialog opens with correct date/time pre-filled |
| B7 | Block past appointment creation | Click on a past time slot | Snackbar: "Не може да се закаже средба во минатото" |
| B8 | Appointment card click | Click on an appointment block | Navigates to /appointments/:id |
| B9 | Appointment tooltip | Hover over an appointment block | Shows "PatientName – XX мин" |
| B10 | Month/year picker | Click month dropdown, select different month | Calendar jumps to first week of that month |
| B11 | Year stepper | Use year chevrons in picker | Calendar updates to selected year |
| B12 | Status colors | Create appointments with different statuses | Correct colors: blue=scheduled, green=completed, grey=cancelled, orange=no-show |
| B13 | Current time indicator | Check calendar during working hours (7-21) | Red line at current time, only on today's column |
| B14 | Legend display | Check below toolbar | All 4 status types with colored dots |
| B15 | Early/late appointments | Create appointment at 7:00 or 20:00 | Visible on calendar grid |
| B16 | API error | Stop backend, navigate to calendar | Snackbar error "Грешка при вчитување на средби", loading indicator clears |

### C. New Appointment Dialog

| # | Test Scenario | Steps | Expected Result |
|---|---|---|---|
| C1 | Patient autocomplete | Type part of a patient name | Dropdown shows matching patients with phone number |
| C2 | Select patient | Click a patient from dropdown | Patient name filled, selection stored |
| C3 | Manual text without selection | Type a name but don't select from dropdown | Hint "Одберете пациент од листата" appears, Save disabled |
| C4 | Duration options | Click duration dropdown | Shows 15, 30, 45, 60, 90, 120 minute options |
| C5 | End time display | Select datetime and duration | "Завршува во HH:mm" hint updates correctly |
| C6 | Past date warning | Select a past datetime | Snackbar warning about past date |
| C7 | Save appointment | Fill all required fields, click "Зачувај" | Dialog closes, calendar refreshes, appointment visible |
| C8 | Cancel dialog | Click "Откажи" | Dialog closes, no changes |
| C9 | Notes field | Add notes text | Notes saved with appointment |

### D. Patient List

| # | Test Scenario | Steps | Expected Result |
|---|---|---|---|
| D1 | List loads | Navigate to /patients | Patient table with avatar, name, phone, EMBG, date columns |
| D2 | Patient count badge | Check header | Shows total number of patients |
| D3 | Search with debounce | Type "Марко" quickly | Only 1-2 API calls fire (not 5) |
| D4 | Search by phone | Type a phone number | Table filters to matching patients |
| D5 | Search by EMBG | Type an EMBG | Table filters to matching patients |
| D6 | Clear search | Click X button on search field | Search cleared immediately (no debounce on clear), all patients shown |
| D7 | Empty search results | Search for non-existent patient | "Нема резултати" empty state with clear button |
| D8 | Empty patient list | (If no patients exist) | "Нема пациенти" with "Додади пациент" button |
| D9 | Pagination | Have > 10 patients, use paginator | Page navigation works, page size options (10, 25, 50) |
| D10 | Click patient row | Click any patient row | Navigates to /patients/:id |
| D11 | New patient button | Click "Нов пациент" | Navigates to /patients/new |
| D12 | API error | Stop backend, navigate to /patients | Snackbar "Грешка при вчитување на пациенти", loading clears |

### E. New Patient Form

| # | Test Scenario | Steps | Expected Result |
|---|---|---|---|
| E1 | Required fields validation | Submit empty form | Error messages on First name, Last name, Phone |
| E2 | Min length validation | Enter 1 character for name | "Минимум 2 карактери" error |
| E3 | Phone format validation | Enter invalid phone "abc" | "Невалиден формат на телефон" error |
| E4 | Email validation | Enter "invalid-email" | "Невалидна е-пошта" error |
| E5 | EMBG validation | Enter "12345" (not 13 digits) | "ЕМБГ мора да содржи точно 13 цифри" error |
| E6 | Date of birth max | Try to select future date | Calendar blocks future dates |
| E7 | Successful save | Fill all required fields correctly, save | Redirected to patient detail page |
| E8 | Duplicate EMBG | Enter EMBG that already exists | Error "Пациент со овој ЕМБГ веќе постои" |
| E9 | Cancel button | Click "Откажи" | Returns to patient list |

### F. Patient Detail

| # | Test Scenario | Steps | Expected Result |
|---|---|---|---|
| F1 | Patient info loads | Navigate to /patients/:id | Patient header with name, phone, email, EMBG, stats |
| F2 | Edit mode | Click "Уреди податоци" | Form fields become editable |
| F3 | Save edits | Edit name, click "Зачувај" | Updated data shown, edit mode closed |
| F4 | Cancel edits | Edit data, click "Откажи" | Original data restored |
| F5 | EMBG locked in edit | Check EMBG field in edit mode | Field disabled |
| F6 | Delete patient | Click "Избриши пациент" | Confirmation dialog with typed confirmation required |
| F7 | Delete confirmed | Type correct full name, click delete | Patient deleted, redirected to /patients |
| F8 | Add allergy | Type allergy name, press Enter or click + | Chip added to allergies list |
| F9 | Remove allergy | Click X on allergy chip | **Confirmation dialog appears**, then allergy removed |
| F10 | Duplicate allergy | Add same allergy name twice | Second attempt blocked (case-insensitive) |
| F11 | Remove condition | Click X on condition chip | **Confirmation dialog appears**, then condition removed |
| F12 | Remove medication | Click X on medication chip | **Confirmation dialog appears**, then medication removed |
| F13 | Appointments tab | Click "Средби" tab | Shows upcoming and past appointments, sorted by date |
| F14 | Financials tab | Click "Финансии" tab | Shows total charged, paid, outstanding; intervention table |
| F15 | Print financials | Click "Печати финансии" | Print window opens with formatted financial report |
| F16 | Print patient history | Click "Печати историја" | Print window with full patient history |
| F17 | Upload document | Click "Избери датотека", select a file | File uploaded, appears in document list |
| F18 | Drag & drop upload | Drag file onto upload area | File uploaded |
| F19 | Download document | Click download icon | File downloads |
| F20 | Delete document | Click delete icon | **Confirmation dialog appears**, then document removed |
| F21 | API errors | Stop backend, navigate to patient | Snackbar errors for failed data loads |
| F22 | Invalid patient ID | Navigate to /patients/999999 | Redirected to /patients |

### G. Appointment Detail

| # | Test Scenario | Steps | Expected Result |
|---|---|---|---|
| G1 | Appointment loads | Navigate to /appointments/:id | Shows patient name, date, time, duration, status |
| G2 | Status: Complete | Click "Заврши" on scheduled appointment | Status changes to completed |
| G3 | Status: Cancel | Click "Откажи" on scheduled appointment | Confirmation dialog, then status changes |
| G4 | Status: No-show | Click "Не дојде" on scheduled appointment | Confirmation dialog, then status changes |
| G5 | Status: Revert | Click "Врати на закажана" on non-scheduled | Status reverts to scheduled |
| G6 | Add intervention | Click "Додади интервенција" | Draft row appears with name input, price, teeth |
| G7 | Catalog autocomplete | Type intervention name in draft | Catalog suggestions appear with prices |
| G8 | Select from catalog | Click a catalog suggestion | Name and price auto-filled |
| G9 | Price confirmation | Have a price set, select catalog item with different price | Dialog asks to confirm price change |
| G10 | Tooth picker | Click teeth button on intervention | Tooth chart dialog opens, select teeth, apply |
| G11 | Save draft | Fill name and price > 0, click "Зачувај" | Intervention saved, draft cleared, list updated |
| G12 | Cancel draft | Click X on draft row | Draft removed |
| G13 | Empty draft validation | Click save with empty name or price 0 | Snackbar: "Име и цена мора да бидат пополнети" |
| G14 | Add payment | Click payment icon on intervention with outstanding | Payment dialog opens |
| G15 | Payment amount validation | Enter amount > outstanding | Error: "Максимален износ: X ден" |
| G16 | Successful payment | Enter valid amount, select method, confirm | Payment recorded, outstanding updated |
| G17 | Delete intervention | Click delete icon | **Confirmation dialog appears** with warning about payments, then deleted |
| G18 | Tooth chart display | Add interventions with teeth | Teeth colored on chart with intervention legend |
| G19 | Print report | Complete appointment, click "Печати извештај" | Print window with formatted report |
| G20 | Invalid appointment ID | Navigate to /appointments/999999 | Redirected to /calendar |
| G21 | API error on interventions | Stop backend after appointment loads | Snackbar "Грешка при вчитување на интервенции" |

### H. Reports

| # | Test Scenario | Steps | Expected Result |
|---|---|---|---|
| H1 | Default view | Navigate to /reports | Monthly financial report loaded |
| H2 | Range toggle | Click Today, Week, Month, Quarter | Data updates for each range |
| H3 | Custom range | Select "Период", pick dates, click load | Report for custom date range |
| H4 | Revenue cards | Check summary cards | Shows revenue, outstanding, appointment count, intervention count |
| H5 | Revenue by type chart | Check bar chart | Bars for each intervention type |
| H6 | Payment method pie | Check pie chart | Pie chart with cash/card/transfer breakdown |
| H7 | Print financial report | Click print button | Formatted report opens in print window |
| H8 | Export Excel | Click Excel export | .xlsx file downloads with summary + breakdown sheets |
| H9 | Outstanding tab | Switch to outstanding tab | List of patients with unpaid balances |
| H10 | Print outstanding | Click print | Formatted outstanding report |
| H11 | All patients summary | Switch to all patients tab | Full patient list with financial summary |
| H12 | Patient search in summary | Type patient name in search | List filters |
| H13 | Debt filter | Toggle debt/no-debt filter | Filters patients with/without outstanding |
| H14 | Per-patient report | Search for patient, select | Shows individual financial breakdown |
| H15 | Patient history report | Go to history tab, search patient | Shows full appointment + intervention history |
| H16 | Print patient history | Click print on loaded patient | Formatted history with letterhead and signature line |
| H17 | API error on summary | Stop backend, load all-patients tab | Snackbar error instead of console.error |
| H18 | Date localization | Check all date displays | Macedonian day/month names (пон, вто... / Јануари, Февруари...) |

### I. Catalog

| # | Test Scenario | Steps | Expected Result |
|---|---|---|---|
| I1 | Catalog loads | Navigate to /catalog | Table with intervention names, prices, usage counts |
| I2 | Search | Type in search field | Filters interventions by name |
| I3 | Add new | Click "Нова интервенција" | Inline add form appears |
| I4 | Save new | Enter name and price, click "Додај" | New item in list |
| I5 | Edit inline | Click edit icon on item | Row becomes editable |
| I6 | Save edit | Change name/price, click checkmark | Item updated |
| I7 | Cancel edit | Press Escape or click X | Original values restored |
| I8 | Delete item | Click delete icon | Confirmation dialog, then deleted |
| I9 | Sort columns | Click column headers | Sorts by name, price, or usage |

### J. Settings

| # | Test Scenario | Steps | Expected Result |
|---|---|---|---|
| J1 | Settings page loads | Navigate to /settings | Shows clinic info, backup, and audit sections |
| J2 | Edit clinic info | Change clinic name/address/phone/email, save | Info saved, snackbar confirmation |
| J3 | Upload logo | Click logo area, select image | Logo uploaded and previewed |
| J4 | Create backup | Click "Направи бекап" | ZIP file downloads, appears in backup list |
| J5 | Download existing backup | Click download on backup item | ZIP file downloads |
| J6 | Restore from backup | Click "Обнови од бекап", select .zip | Confirmation dialog with warning, then restore + redirect to login |
| J7 | Audit log display | Check audit table | Shows recent actions with time, user, action, entity |
| J8 | Export logs | Click "Преземи логови" | ZIP file downloads with log data |

### K. System & Edge Cases

| # | Test Scenario | Steps | Expected Result |
|---|---|---|---|
| K1 | Server unreachable | Stop the backend server | Red banner: "Серверот не е достапен" in shell |
| K2 | Server recovery | Restart backend after K1 | Banner disappears within 30 seconds (health polling) |
| K3 | Backup warning | Don't create backup for 7+ days | Yellow/red banner in shell with backup reminder |
| K4 | Browser refresh | Refresh any page | Page reloads correctly, session maintained |
| K5 | Direct URL navigation | Enter /patients/5 directly in browser | Loads correct patient (if exists) |
| K6 | Unknown route | Navigate to /nonexistent | Redirects to /calendar |
| K7 | Help page | Navigate to /help | Shows categorized tips, category filter works |
| K8 | Sidebar navigation | Click each sidebar item | Correct route loads, active item highlighted |
| K9 | Special characters | Create patient with name containing quotes, accents | Data saved and displayed correctly |
| K10 | Letterhead on reports | Configure clinic info + logo, then print any report | Letterhead with logo, name, address, contact shown at top |

### L. Data Integrity Checks

| # | Test Scenario | Steps | Expected Result |
|---|---|---|---|
| L1 | Payment doesn't exceed outstanding | Try payment > outstanding | Validation blocks it |
| L2 | Delete patient with appointments | Delete a patient with history | Confirmation shows impact count, deletion works |
| L3 | Appointment financial totals | Add 3 interventions with different prices and partial payments | Totals (charged, paid, outstanding) calculate correctly |
| L4 | Patient financial summary | Check patient detail financials tab | Matches sum of all intervention data |
| L5 | EMBG uniqueness | Try creating two patients with same EMBG | Second attempt shows 409 error message |

---

## PART 3: SUMMARY

### Remaining Items (post-launch)
- BUG-10: Delete orphaned `app.html`
- BUG-11: Unsaved changes guard
- BUG-12: Patient detail loading state
- BUG-13: Package version → 1.0.0
- BUG-14: XSS in print (negligible risk for single-user)
- BUG-15: Global error handler
- BUG-16: 404 page
- BUG-17: Subject cleanup pattern

### Production Build Checklist
- [ ] `ng build --configuration production` succeeds
- [ ] `environment.production.ts` uses relative URL `/api/v1` (verified OK)
- [ ] No hardcoded `localhost` in production code (verified OK)
- [ ] Bundle size within budget (500kB warning, 1MB error)
- [ ] All API endpoints match BE controllers (verified OK)
- [ ] Date localization shows Macedonian (BUG-01 fixed)
- [ ] Calendar shows 7:00-21:00 range (BUG-09 fixed)
