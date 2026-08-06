# Helios Towers Supply Chain Handbook — Administrator Guide

Welcome to the **Helios Towers Supply Chain Handbook Administrator Portal**. This non-technical guide explains how to manage handbook content, maintain delivery lead times, update procurement steps, perform bulk Excel updates, and generate official QR codes for print materials.

---

## 1. Accessing & Logging In

1. Open your web browser and navigate to the Admin Portal URL (e.g., `https://your-domain.com/admin` or `http://localhost:3000/admin`).
2. If you are not signed in, you will automatically be redirected to the **Admin Login Page** (`/admin/login`).
3. Enter your authorized Helios Towers email address and password.
4. Click **Sign In to Dashboard**.

---

## 2. Browser-Based Editing

You can add, edit, or publish individual items directly in your browser without using Excel.

### Delivery Timelines (`/admin/delivery-timelines`)
- **Add New Item**: Click **Add New Timeline** at the top right. Fill in the Department, Category, Item Name, Lead Time, Requirements, Notes, and Publishing Status.
- **Edit Item**: Click the **Pencil Icon** on any row to edit fields in a pop-up window.
- **Publish / Unpublish**: Click the **Publish** or **Unpublish** button on any row. Published items immediately become visible on the public handbook; Draft items remain hidden.
- **Delete Item**: Click the **Trash Icon** on any row and confirm in the dialog box.

### Procurement Steps (`/admin/procurement-steps`)
- **Add New Step**: Click **Add Process Step**. Enter Step Number, Title, Description, Responsible Party, Duration, and Status.
- **Reorder Steps**: Use the **↑ Up** and **↓ Down** buttons under Step Ordering Quick Controls to adjust sequence.
- **Publish / Unpublish**: Toggle the status button on any step.

### FAQs (`/admin/faqs`)
- Add or edit common questions and detailed answers categorized by topic (Requests, Timelines, Sourcing, Suppliers, Support).

### Site Information Settings (`/admin/site-information`)
- Maintain handbook metadata including Version Number, Last Updated date, Contact Email, Office Location, Working Hours, and Public Announcement Notices.

---

## 3. Bulk Excel Workflow (Download, Edit & Re-upload)

When managing large numbers of items, you can download the entire handbook as an Excel file, edit it in Microsoft Excel, and re-upload it.

> [!IMPORTANT]
> **Source of Truth**: The database is always the source of truth. Uploading an Excel file will **never** immediately overwrite live data. You will always be shown a **Validation Report** and **Change Preview** first.

### Step-by-Step Excel Procedure:

1. **Download Current Workbook**: On the Admin Dashboard or management pages, click **Download Workbook**. This saves `Helios_Towers_Supply_Chain_Handbook_YYYY-MM-DD.xlsx` to your computer.
2. **Edit in Excel**:
   - **DO NOT** edit or delete Column A (`Record ID`) for existing rows.
   - **DO NOT** rename or move column headers.
   - To add a **NEW** item, add a row at the bottom and leave Column A (`Record ID`) **BLANK**.
   - Use only approved departments: `Information Technology`, `Administration`, `Network Operations`, `Fleet`, `Health, Safety and Environment`, `Professional Services`.
   - Use only approved statuses: `published` or `draft`.
   - **DO NOT** use Excel formulas (cells starting with `=`, `+`, `-`, `@` are blocked for security).
3. **Upload Completed Workbook**:
   - Click **Upload Workbook** to launch the 4-step Upload Wizard.
   - Select your `.xlsx` file (maximum file size: 5 MB).
4. **Review Validation Results**:
   - The system performs 28 automated security and formatting checks.
   - If blocking errors are found (e.g. invalid department or missing required field), they are clearly highlighted with sheet name and row number.
   - Correct the errors in Excel and re-upload.
5. **Review Change Preview**:
   - Once validation passes, click **Proceed to Change Preview**.
   - The system displays a visual diff showing exactly what will change:
     - **Inserts** (+ New items)
     - **Updates** (~ Field changes with old vs. new values)
     - **Missing Rows** (Items in DB but not in your Excel file — choose whether to Keep Unchanged, Unpublish, or Delete).
6. **Confirm & Apply Import**:
   - Select whether to import as **Draft** or **Publish Immediately**.
   - Click **Confirm & Apply Import**.
   - A pre-import **snapshot backup** is automatically saved, and the changes are applied to the database.

---

## 4. Import History & Rollback

Every Excel upload is recorded in **Import History** (`/admin/import-history`).

- **View Past Batches**: See the date, filename, uploader, counts of inserted/updated/deleted rows, and status.
- **Rollback an Import**: If an imported Excel file contained mistakes:
  1. Go to `/admin/import-history` and click **View Details** next to the batch.
  2. Review the pre-import snapshot data.
  3. Click **Rollback Import Batch** and confirm.
  4. The database is instantly restored to its exact pre-import state!

---

## 5. Generating Print QR Codes

To generate official QR codes for posters, badges, or printed manuals:

1. In the Admin Portal sidebar, click **QR Code Generator** (or visit `/admin/site-information/qr-code`).
2. The page generates a QR code pointing strictly to the public handbook homepage.
3. Click **Download High-Res PNG (1024px)** for printing, or **Download Vector SVG** for graphic design tools.
4. The page includes a print-preview card formatted with official Helios Towers branding and "Internal Use Only" notices.

---

## 6. Signing Out

Always click **Sign Out** in the top right header when completing your administrative session.
