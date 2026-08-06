# Helios Towers Supply Chain Handbook — Final Launch Checklist

Use this checklist before promoting the application to production or publishing to organizational end users.

---

## 1. Content & Branding Verification
- [ ] **Contact Details**: Replace placeholder email (`supplychain@example.com`) with official team email address in Site Information Settings.
- [ ] **Office Location & Hours**: Verify physical office location and working hours in Site Information Settings.
- [ ] **Delivery Timelines**: Review all 16 default delivery timeline lead times across departments with Supply Chain management.
- [ ] **Procurement Process**: Confirm all 8 procurement steps match corporate procurement policy.
- [ ] **FAQs**: Verify all 9 FAQ questions and answers are current and accurate.
- [ ] **Corporate Logo**: Confirm logo renders cleanly on light and dark header backgrounds.

---

## 2. Database & Security Audit
- [ ] **Supabase Migration**: Confirm `supabase-schema.sql` and `supabase-phase3-migration.sql` have been executed in Supabase SQL Editor.
- [ ] **Row Level Security (RLS)**: Confirm RLS is enabled on all 9 database tables (`delivery_timelines`, `procurement_steps`, `faqs`, `site_information`, `admins`, `audit_log`, `import_history`, `import_batches`, `data_snapshots`).
- [ ] **Public Read Policy**: Test that unauthenticated users can only query rows with `status = 'published'`.
- [ ] **Admin Account Verification**: Ensure at least one active user exists in the `admins` table. Delete any temporary/test admin accounts.
- [ ] **Service Role Key Safety**: Confirm `SUPABASE_SERVICE_ROLE_KEY` is **never** included in browser code or prefixed with `NEXT_PUBLIC_`.

---

## 3. Environment & Vercel Deployment Configuration
- [ ] **`.env.local` Excluded**: Confirm `.env.local` is listed in `.gitignore` and not committed to repository.
- [ ] **`NEXT_PUBLIC_SUPABASE_URL`**: Configured in Vercel project environment variables.
- [ ] **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Configured in Vercel project environment variables.
- [ ] **`NEXT_PUBLIC_SITE_URL`**: Configured with final production domain (e.g. `https://handbook.heliostowers.com`).
- [ ] **Supabase Redirect URLs**: Add production URL to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs.

---

## 4. Feature Testing & Verification
- [ ] **Production Build**: Run `npm run build` locally to verify 0 compilation errors.
- [ ] **Lint Check**: Run `npm run lint` to verify 0 ESLint errors/warnings.
- [ ] **Public Navigation**: Verify all 5 public pages load quickly and render correctly.
- [ ] **Admin Route Protection**: Confirm unauthenticated access to `/admin` redirects to `/admin/login`.
- [ ] **Browser Editing**: Test manual Add, Edit, Publish/Unpublish, and Delete for timelines, steps, and FAQs.
- [ ] **Excel Export**: Download current workbook and verify all 4 sheets (`Instructions`, `Delivery Timelines`, `Procurement Process`, `Reference Data`) are present.
- [ ] **Excel Upload Validation**: Upload a test workbook with intentional errors (e.g. invalid department) and confirm blocking errors are displayed.
- [ ] **Excel Change Preview**: Upload a valid edited workbook and verify diff preview accurately highlights changes.
- [ ] **Import & Audit Log**: Confirm successful import updates database and writes entry to `audit_log`.
- [ ] **Snapshot Rollback**: Test batch rollback from `/admin/import-history/[id]` and verify pre-import database state is restored.
- [ ] **QR Code Generation**: Visit `/admin/site-information/qr-code`, download high-res PNG, scan with mobile phone camera, and verify it opens public homepage.

---

## 5. Multi-Device & Browser Compatibility
- [ ] **Desktop Browser**: Tested on Chrome, Edge, Safari, Firefox.
- [ ] **Tablet Browser**: Tested responsive grid on iPad / Android tablet.
- [ ] **Mobile Device**: Tested navigation menu, timeline card layout, and search inputs on mobile screen (iOS & Android).
