# Helios Towers Supply Chain Handbook — Manual Acceptance Test Suite

This document defines manual test scenarios to validate Phase 1, Phase 2, and Phase 3 requirements before production sign-off.

---

## Test Suite 1: Unauthenticated Public User

| Test ID | Scenario | Expected Result | Pass/Fail |
|---------|----------|-----------------|-----------|
| PUB-01 | Access Homepage (`/`) | Page loads with corporate header, logo, hero banner, search bar, and 3 quick access cards. | |
| PUB-02 | Access Delivery Timelines (`/delivery-timelines`) | Search and department filter work. Shows published lead times. Draft items are hidden. | |
| PUB-03 | Access Procurement Process (`/procurement-process`) | Displays sequential steps with responsible party & duration. | |
| PUB-04 | Access FAQs (`/faqs`) | Accordion list opens/closes answers cleanly. Category filter works. | |
| PUB-05 | Access Contact (`/contact`) | Displays team email, office, working hours, and checklist. | |
| PUB-06 | Access Admin Route (`/admin`) | Automatically redirected to `/admin/login`. | |
| PUB-07 | Access Admin Sub-route (`/admin/delivery-timelines`) | Automatically redirected to `/admin/login`. | |

---

## Test Suite 2: Authenticated Administrator (Browser Editing)

| Test ID | Scenario | Expected Result | Pass/Fail |
|---------|----------|-----------------|-----------|
| ADM-01 | Admin Login (`/admin/login`) | Valid email/password logs in and redirects to `/admin` dashboard. | |
| ADM-02 | Admin Invalid Login | Error message displayed; access denied. | |
| ADM-03 | Add Delivery Timeline | Modal opens, accepts input, saves to database, writes `audit_log` entry. | |
| ADM-04 | Edit Delivery Timeline | Modal pre-populates existing data. Saving updates database row. | |
| ADM-05 | Toggle Status (Publish/Unpublish) | Status changes to Published/Draft. Public site updates immediately. | |
| ADM-06 | Reorder Procurement Steps | Step numbers update; display sequence persists. | |
| ADM-07 | Edit Site Information | Saves Version, Contact Email, Office, Working Hours. Updates public contact page. | |
| ADM-08 | Sign Out | Clears session and redirects to `/admin/login`. | |

---

## Test Suite 3: Bulk Excel Operations & Validation

| Test ID | Scenario | Expected Result | Pass/Fail |
|---------|----------|-----------------|-----------|
| EXC-01 | Export Current Workbook | Downloads `Helios_Towers_Supply_Chain_Handbook_YYYY-MM-DD.xlsx` containing 4 sheets (`Instructions`, `Delivery Timelines`, `Procurement Process`, `Reference Data`). | |
| EXC-02 | Export Blank Template | Downloads template with headings & instructions, without existing data rows. | |
| EXC-03 | Upload Non-Excel File | Uploading `.csv` or `.png` is blocked with clear error message. | |
| EXC-04 | Upload Oversized File (>5MB) | Upload blocked with size limit error message. | |
| EXC-05 | Upload Workbook with Invalid Department | Upload Wizard Step 2 highlights blocking error (Sheet, Row, Column, Error message). | |
| EXC-06 | Upload Workbook with Formula Cells | Cells starting with `=`, `+`, `-`, `@` trigger formula blocking error. | |
| EXC-07 | Upload Valid Workbook | Upload Wizard proceeds to Step 3 Change Preview, displaying exact field diffs. | |
| EXC-08 | Handle Missing Rows | Admin can choose Keep Unchanged (default), Unpublish, or Delete for missing rows. | |
| EXC-09 | Confirm & Apply Import | Creates pre-import snapshot, applies edits, logs `audit_log` entry, updates database. | |
| EXC-10 | Rollback Import | `/admin/import-history/[id]` Rollback restores exact pre-import snapshot state. | |

---

## Test Suite 4: QR Code & Mobile Responsiveness

| Test ID | Scenario | Expected Result | Pass/Fail |
|---------|----------|-----------------|-----------|
| QR-01 | Visit QR Code Page (`/admin/site-information/qr-code`) | Displays print-preview card, target URL, and PNG/SVG download buttons. | |
| QR-02 | Download High-Res PNG | Downloads `Helios_Towers_Supply_Chain_Handbook_QR.png` (1024x1024 px). | |
| QR-03 | Scan QR Code | Scanning with smartphone camera opens public homepage URL. | |
| MOB-01 | Mobile Navigation | Header hamburger menu opens/closes navigation cleanly on small screen. | |
| MOB-02 | Mobile Delivery Cards | Delivery timelines switch to responsive card grid on mobile width (<768px). | |
