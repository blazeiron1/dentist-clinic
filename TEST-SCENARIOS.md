# Test Scenarios — Dental Clinic ERP

**Goal:** Confirm the system is ready for daily use by the doctor.
**Order:** Normal daily workflows first, then edge cases.

---

## 1. Morning Startup

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1.1 | Open the app | Navigate to `http://localhost:8080` | Login page appears |
| 1.2 | Log in | Enter credentials, click Најави се | Calendar loads, today's week visible, your name in the sidebar |
| 1.3 | Check today | Verify today's column is highlighted | Blue circle on today's date, red time indicator line at current hour |
| 1.4 | See today's appointments | Check calendar | All scheduled appointments for today are visible as colored blocks |

---

## 2. New Patient Walks In

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 2.1 | Create patient | Patients → Нов пациент → fill Име, Презиме, Телефон → Зачувај | Redirected to patient detail, data visible in header |
| 2.2 | Add full info | Also fill ЕМБГ, е-пошта, адреса, датум на раѓање, белешки | All fields saved and displayed |
| 2.3 | Add allergies | Medical tab → type "Пеницилин" → Enter | Chip appears in allergy section |
| 2.4 | Add condition | Type "Дијабетес" → Enter | Chip appears in conditions |
| 2.5 | Add medication | Type "Метформин" → Enter | Chip appears in medications |
| 2.6 | Find patient later | Go to Пациенти → search by name | Patient found in the list |
| 2.7 | Find by phone | Search by phone number | Patient found |
| 2.8 | Find by ЕМБГ | Search by ЕМБГ | Patient found |

---

## 3. Schedule an Appointment

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 3.1 | Click time slot | On calendar, click an empty slot at 10:00 tomorrow | Dialog opens with date/time pre-filled to tomorrow 10:00 |
| 3.2 | Search patient | Type patient name in dialog | Dropdown shows matching patients with phone |
| 3.3 | Select patient | Click the patient from dropdown | Name fills in, save button enabled |
| 3.4 | Set duration | Pick 30 мин from dropdown | "Завршува во 10:30" hint appears |
| 3.5 | Add note | Type "Контролен преглед" in notes | Note visible |
| 3.6 | Save | Click Зачувај | Dialog closes, blue appointment block appears on calendar at 10:00 |
| 3.7 | Verify tooltip | Hover over the new block | Shows "Име Презиме – 30 мин" |

---

## 4. Patient Arrives — Complete an Appointment

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 4.1 | Open appointment | Click the appointment block on calendar | Appointment detail page loads with patient name, time, status "Закажана" |
| 4.2 | Go to patient | Click the patient name link | Patient detail opens in context |
| 4.3 | Go back | Click back arrow | Returns to appointment detail |
| 4.4 | Add intervention | Click Додади интервенција | Draft row appears with empty name/price |
| 4.5 | Use catalog | Type "Композ" in the name field | Catalog autocomplete shows "Composite filling" with price |
| 4.6 | Select from catalog | Click the suggestion | Name and price auto-fill |
| 4.7 | Pick teeth | Click the tooth button on the draft | Tooth chart dialog opens |
| 4.8 | Select teeth | Click teeth 16 and 17 on the chart → Примени | Teeth 16, 17 shown on draft row |
| 4.9 | Save intervention | Click Зачувај | Intervention saved, appears in the list, tooth chart updates with colors |
| 4.10 | Add second intervention | Repeat 4.4-4.9 with a different procedure (e.g., X-ray on same tooth) | Two interventions listed, both teeth colored on chart |
| 4.11 | Record payment | Click the payment icon on the first intervention | Payment dialog opens showing outstanding amount |
| 4.12 | Full payment | Enter the full amount, select Готовина, confirm | Outstanding shows 0, green checkmark appears |
| 4.13 | Partial payment | On second intervention, pay half the amount | Outstanding shows remaining balance |
| 4.14 | Complete appointment | Click Заврши | Status changes to "Завршена", color turns green |
| 4.15 | Print report | Click Печати извештај | Print window opens with letterhead, patient info, interventions table, totals, signature line |

---

## 5. Check Patient History

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 5.1 | Open patient | Пациенти → click the patient | Detail page with header stats |
| 5.2 | See appointments | Click Средби tab | Lists upcoming (top) and past (bottom) appointments |
| 5.3 | See financials | Click Финансии tab | Table of all interventions across all appointments, totals at bottom |
| 5.4 | Verify totals | Check Вкупно/Платено/Долг in header | Numbers match the sum of interventions |
| 5.5 | Print financials | Click Печати финансии | Print window with financial summary |
| 5.6 | Print full history | Click Печати историја | Full history with every appointment, interventions, and totals |
| 5.7 | Upload document | Click Документи tab → Избери датотека → pick a PDF | File uploaded, shows in document list with correct icon |
| 5.8 | Download document | Click download icon on uploaded file | File downloads correctly |

---

## 6. End of Day — Reports

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 6.1 | Open reports | Click Извештаи in sidebar | Monthly report loads by default |
| 6.2 | Today's report | Click Денес | Shows today's revenue, appointments, interventions |
| 6.3 | Revenue cards | Check the 4 summary cards | Приход, Неплатено, Средби, Интервенции — numbers match your day |
| 6.4 | Revenue by type | Check bar chart | Bars for each intervention type performed today |
| 6.5 | Payment methods | Check pie chart | Breakdown of cash/card/transfer |
| 6.6 | Print report | Click print button | Formatted financial report with letterhead |
| 6.7 | Export Excel | Click Excel button | .xlsx downloads with summary + breakdown sheets |
| 6.8 | Outstanding patients | Click Неплатени tab | List of patients with remaining debt |
| 6.9 | Weekly report | Click Недела | Revenue for the current week |
| 6.10 | Monthly report | Click Месец | Revenue for the current month |
| 6.11 | Quarterly report | Click Квартал | Revenue for the current quarter |
| 6.12 | Custom range | Click Период → pick two dates → load | Report for that date range |

---

## 7. Catalog Management

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 7.1 | View catalog | Click Каталог | Table with all intervention types, prices, usage counts |
| 7.2 | Add new type | Click Нова интервенција → type "Белење на заби" / 5000 → Додај | New item appears in list |
| 7.3 | Edit price | Click edit icon → change price → save | Price updated |
| 7.4 | Search catalog | Type in search field | Filters list to matching items |
| 7.5 | Verify auto-catalog | Go create an intervention with a brand new name | That name appears in catalog next time |

---

## 8. Settings & Backup

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 8.1 | Edit clinic info | Settings → change name/address/phone/email → Зачувај | Snackbar confirms, info persists after refresh |
| 8.2 | Upload logo | Click the logo area → select image file | Logo appears in preview, shows on printed reports |
| 8.3 | Create backup | Click Направи бекап | ZIP file downloads, appears in backup list with timestamp |
| 8.4 | Verify backup list | Check backup table | Shows filename, size, date — sorted newest first |
| 8.5 | Download old backup | Click download on a previous backup | ZIP file downloads |
| 8.6 | View audit log | Scroll to audit section | Shows recent actions (who did what, when) |
| 8.7 | Export logs | Click Преземи логови | ZIP with audit data downloads |

---

## 9. Calendar Navigation

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 9.1 | Next week | Click → arrow | Next week loads with its appointments |
| 9.2 | Previous week | Click ← arrow | Previous week loads |
| 9.3 | Today button | Navigate away, click Денес | Returns to current week with today highlighted |
| 9.4 | Day view | Click Ден | Single-day view with that day's appointments |
| 9.5 | Back to week | Click Недела | Week view returns |
| 9.6 | Month picker | Click month button → select Март | Calendar jumps to first week of March |
| 9.7 | Year stepper | Use ← / → on year | Calendar jumps to that year |
| 9.8 | Early appointment | If an appointment exists at 7:00 | Visible on the calendar grid |
| 9.9 | Late appointment | If an appointment exists at 20:00 | Visible on the calendar grid |
| 9.10 | Status colors | Check appointment blocks | Blue = закажана, Green = завршена, Grey = откажана, Orange = не дојде |

---

## 10. Appointment Status Changes

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 10.1 | Cancel appointment | Open scheduled appointment → click Откажи | Confirmation dialog → status "Откажана", grey on calendar |
| 10.2 | Mark no-show | Open scheduled appointment → click Не дојде | Confirmation dialog → status "Не дојде", orange on calendar |
| 10.3 | Revert to scheduled | Open cancelled/no-show → click Врати на закажана | Status back to "Закажана", blue on calendar |
| 10.4 | Complete appointment | Open scheduled → click Заврши | Status "Завршена", green on calendar |

---

## 11. Payments & Debt Tracking

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 11.1 | Full payment at once | Add intervention 1000 ден → pay 1000 | Outstanding = 0, green checkmark |
| 11.2 | Split payment | Add 1000 ден intervention → pay 500 now | Outstanding = 500, payment icon still shows |
| 11.3 | Pay remaining later | Open same appointment later → pay remaining 500 | Outstanding = 0, green checkmark |
| 11.4 | Multiple methods | Pay 300 cash, then 200 card on same intervention | Both payments recorded, total = 500 |
| 11.5 | Check patient debt | Go to patient detail → Финансии tab | Долг card shows correct total across all appointments |
| 11.6 | Outstanding report | Reports → Неплатени tab | Patient appears with correct debt amount |
| 11.7 | Debt filter | Reports → Сите пациенти → filter by "Долг" | Only patients with outstanding balance shown |

---

## 12. Document Management

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 12.1 | Upload image | Patient → Документи → upload a .jpg | Image appears with image icon |
| 12.2 | Upload PDF | Upload a .pdf | Appears with PDF icon |
| 12.3 | Drag & drop | Drag a file from desktop onto the upload area | File uploads |
| 12.4 | Download file | Click download icon | Correct file downloads with original filename |
| 12.5 | Delete file | Click delete icon | Confirmation dialog → file removed from list |
| 12.6 | File size display | Check the size column | Shows KB/MB correctly |

---

## 13. Edit & Delete with Confirmation

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 13.1 | Edit patient | Patient detail → Уреди податоци → change phone → Зачувај | Phone updated |
| 13.2 | Cancel edit | Start editing → Откажи | Original values restored |
| 13.3 | Delete allergy | Click X on allergy chip | Confirmation dialog → removed on confirm |
| 13.4 | Cancel allergy delete | Click X → Откажи in dialog | Allergy stays |
| 13.5 | Delete condition | Click X on condition chip | Confirmation dialog → removed |
| 13.6 | Delete medication | Click X on medication chip | Confirmation dialog → removed |
| 13.7 | Delete intervention | Appointment → click delete on intervention | Confirmation warns about payments → removed |
| 13.8 | Delete document | Click delete on document | Confirmation with filename → removed |
| 13.9 | Delete patient | Patient → Избриши пациент | Must type full name to confirm → deleted, redirected to list |

---

## 14. Print & Letterhead

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 14.1 | Setup letterhead | Settings → fill clinic name, address, phone, email, upload logo | All saved |
| 14.2 | Print appointment report | Appointment detail → Печати извештај | Letterhead with logo at top, patient info, intervention table, totals, signature line |
| 14.3 | Print patient financials | Patient → Финансии → Печати финансии | Letterhead, financial summary, intervention breakdown |
| 14.4 | Print patient history | Patient → Печати историја | Full history with every appointment and intervention |
| 14.5 | Print daily report | Reports → Денес → print | Daily financial summary with letterhead |
| 14.6 | Print outstanding | Reports → Неплатени → print | List of patients with debt |
| 14.7 | Verify auto-print | Any print window | Auto-opens print dialog, auto-closes after print/cancel |

---

## 15. Macedonian Localization

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 15.1 | Calendar day names | Check week view headers | пон, вто, сре, чет, пет, саб, нед (not Mon, Tue...) |
| 15.2 | Calendar month names | Check month picker | Јануари, Февруари... (not January...) |
| 15.3 | Date formatting | Check dates throughout the app | Macedonian format (d.M.y) |
| 15.4 | All labels in Macedonian | Navigate through every page | No English UI text anywhere |

---

## 16. Backup & Restore

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 16.1 | Create backup | Settings → Направи бекап | ZIP downloads, appears in list |
| 16.2 | Add data after backup | Create a new patient with appointments and payments | New data visible |
| 16.3 | Restore from backup | Settings → Обнови од бекап → select the ZIP from 16.1 | Confirmation dialog warns about data loss |
| 16.4 | Confirm restore | Click confirm | App redirects to login |
| 16.5 | Verify restored state | Log in → check patients | Only data from before the backup — the patient from 16.2 is gone |
| 16.6 | Create new records after restore | Add a new patient, appointment, intervention, payment | Everything works, no sequence/duplicate ID errors |
| 16.7 | Verify sequences | Create 3 patients in a row | IDs increment correctly (no gaps causing errors, no duplicate key) |

---

## 17. System Health

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 17.1 | Server healthy | Normal operation | No banners, green status |
| 17.2 | Server goes down | Stop the backend process | Red banner "Серверот не е достапен" appears within 30 seconds |
| 17.3 | Server comes back | Start backend again | Banner disappears within 30 seconds |
| 17.4 | Backup reminder | Don't create backup for 3+ days | Yellow warning banner appears |
| 17.5 | Critical backup warning | Don't backup for 7+ days | Red warning banner |
| 17.6 | Dismiss warning | Click X on backup banner | Banner hides for the session |

---

## 18. Session & Auth

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 18.1 | Stay logged in | Use the app, refresh page | Still logged in |
| 18.2 | Logout | Click username → Одјави се | Redirected to login |
| 18.3 | Can't access after logout | Try navigating to /calendar directly | Redirected to login |
| 18.4 | Wrong password | Try logging in with wrong password | "Погрешни податоци" error |
| 18.5 | Empty fields | Click login without filling anything | Validation messages appear |

---

## 19. Per-Patient Reports (from Reports page)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 19.1 | Patient financial report | Reports → Финансии по пациент → search patient → select | Individual financial breakdown loads |
| 19.2 | Print patient report | Click print | Formatted with letterhead |
| 19.3 | Export patient Excel | Click Excel | .xlsx with patient's intervention data |
| 19.4 | Patient history report | Reports → Историја → search patient → select | Full chronological appointment history |
| 19.5 | Print history | Click print | History report with signature line |
| 19.6 | All patients summary | Reports → Сите пациенти | Full list with totals |
| 19.7 | Sort by debt | Click Долг column header | Patients sorted by outstanding amount |
| 19.8 | Filter date range | Set from/to dates → apply | Summary filtered to that period |
| 19.9 | Export all patients | Click Excel | .xlsx with all patients' financial data |

---

## 20. Edge Cases — Things That Shouldn't Break

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 20.1 | Past appointment | Click a past time slot on calendar | Snackbar "Не може да се закаже средба во минатото" |
| 20.2 | Overpayment | Try entering payment > outstanding amount | Validation blocks it |
| 20.3 | Zero-price intervention | Add intervention with price 0 (e.g., free checkup) | Saves correctly, outstanding = 0 |
| 20.4 | Duplicate ЕМБГ | Create patient with same ЕМБГ as existing | Error "Пациент со овој ЕМБГ веќе постои" |
| 20.5 | Duplicate allergy | Add same allergy twice on same patient | Second attempt silently ignored |
| 20.6 | Empty intervention name | Try saving draft with no name | Snackbar "Име и цена мора да бидат пополнети" |
| 20.7 | Negative price | Type -100 as intervention price | Validation blocks it or treats as invalid |
| 20.8 | Very long patient name | Create patient with 100-character name | Saves, displays truncated where needed |
| 20.9 | Special characters in name | Patient name: O'Brien, Müller, Çelik | Saves and displays correctly |
| 20.10 | Patient with no appointments | Open new patient's Средби tab | "Нема средби" empty state |
| 20.11 | Patient with no documents | Open Документи tab | Upload area shown, no errors |
| 20.12 | Refresh mid-edit | Start editing patient → F5 | Page reloads, edit mode exits, original data shown |
| 20.13 | Direct URL to nonexistent patient | Navigate to /patients/999999 | Redirected to /patients |
| 20.14 | Direct URL to nonexistent appointment | Navigate to /appointments/999999 | Redirected to /calendar |
| 20.15 | Unknown URL | Navigate to /asdfgh | Redirected to /calendar |
| 20.16 | Multiple interventions same tooth | Add two interventions both on tooth 16 | Both show, tooth colored by latest |
| 20.17 | All 32 teeth selected | Add intervention → select all teeth in picker | All teeth shown, saves correctly |
| 20.18 | No teeth selected | Add intervention with no teeth picked | Saves correctly, teeth column shows "—" |
| 20.19 | Cancel every dialog | Open new appointment → Откажи, open tooth picker → Откажи, etc. | Nothing changes, no side effects |
| 20.20 | Rapidly click save | Double-click Зачувај on intervention draft quickly | Only one intervention created (not duplicated) |
| 20.21 | Very long note | Add 2000-character note on appointment | Saves and displays, possibly truncated in views |
| 20.22 | Search with special chars | Search patients for "O'Brien" or "%" | No errors, returns matches or empty |
| 20.23 | Upload large file | Upload a 15MB PDF as patient document | Uploads successfully (max is 20MB) |
| 20.24 | Upload rejected file type | Upload a .exe or .zip as document | Error message from server |
| 20.25 | Restore then immediately create | Restore backup → log in → create patient → create appointment → add intervention → pay | Full workflow works without sequence errors |
| 20.26 | Multiple restores in a row | Restore backup A → restore backup B | Both work, data matches backup B |
| 20.27 | Print with no logo configured | Remove logo → print any report | Report prints without logo, no broken image |
| 20.28 | Report with no data | Reports → pick a date range with no appointments | Shows zeros, no errors, charts empty |
| 20.29 | Outstanding with no debt | Outstanding tab when everyone has paid | Empty list or "Нема неплатени" |
| 20.30 | Page size change | Patient list → change page size from 10 to 50 | Table refreshes with up to 50 rows |
| 20.31 | Catalog search no results | Catalog → search for "xyznonexistent" | Empty state, no crash |
| 20.32 | Delete only patient | Have exactly 1 patient → delete them | Patient deleted, list shows empty state |
| 20.33 | Browser back button | Complete a flow → press browser back | Previous page loads without errors |
| 20.34 | Appointment with 15-min duration | Create 15-min appointment | Small but visible block on calendar |
| 20.35 | Appointment with 2-hour duration | Create 120-min appointment | Tall block spanning 2 hour slots |
| 20.36 | Two appointments same time | Create two appointments at the same time slot | Both visible (may overlap on calendar) |
| 20.37 | Intervention price with decimals | Enter price 1500.50 | Saves and displays correctly |
| 20.38 | Payment with decimals | Pay 750.25 | Saves correctly, outstanding calculates right |
| 20.39 | Help page | Click Помош | Tips displayed, category filter works |
| 20.40 | Rapid page navigation | Click Календар → Пациенти → Извештаи → Каталог quickly | All pages load, no stuck loading states |
