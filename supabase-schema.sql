-- ====================================================
-- Helios Supply Chain Handbook — Supabase Schema
-- Phase 2: Backend Foundation
-- ====================================================

-- 1. Admins table (links to Supabase Auth users)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Delivery Timelines
CREATE TABLE IF NOT EXISTS delivery_timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department TEXT NOT NULL,
  category TEXT NOT NULL,
  item TEXT NOT NULL,
  estimated_lead_time TEXT NOT NULL,
  requirements TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 3. Procurement Steps
CREATE TABLE IF NOT EXISTS procurement_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  responsible_party TEXT NOT NULL DEFAULT '',
  expected_duration TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 4. FAQs
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 5. Site Information (single-row table)
CREATE TABLE IF NOT EXISTS site_information (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  version TEXT NOT NULL DEFAULT '1.0',
  last_updated TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  office TEXT NOT NULL DEFAULT '',
  working_hours TEXT NOT NULL DEFAULT '',
  homepage_notice TEXT NOT NULL DEFAULT '',
  support_message TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- 6. Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'publish', 'unpublish')),
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Import History (placeholder for Phase 3)
CREATE TABLE IF NOT EXISTS import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  file_name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  records_imported INTEGER NOT NULL DEFAULT 0,
  records_failed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================
-- Row Level Security (RLS)
-- ====================================================

ALTER TABLE delivery_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public can read published delivery timelines"
  ON delivery_timelines FOR SELECT
  USING (status = 'published');

CREATE POLICY "Public can read published procurement steps"
  ON procurement_steps FOR SELECT
  USING (status = 'published');

CREATE POLICY "Public can read published faqs"
  ON faqs FOR SELECT
  USING (status = 'published');

CREATE POLICY "Public can read site information"
  ON site_information FOR SELECT
  USING (true);

-- Admin full access (authenticated users who are in admins table)
CREATE POLICY "Admins have full access to delivery timelines"
  ON delivery_timelines FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM admins WHERE is_active = true));

CREATE POLICY "Admins have full access to procurement steps"
  ON procurement_steps FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM admins WHERE is_active = true));

CREATE POLICY "Admins have full access to faqs"
  ON faqs FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM admins WHERE is_active = true));

CREATE POLICY "Admins have full access to site information"
  ON site_information FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM admins WHERE is_active = true));

CREATE POLICY "Admins can read admins table"
  ON admins FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM admins WHERE is_active = true));

CREATE POLICY "Admins can read audit log"
  ON audit_log FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM admins WHERE is_active = true));

CREATE POLICY "Admins can insert audit log"
  ON audit_log FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM admins WHERE is_active = true));

CREATE POLICY "Admins can manage import history"
  ON import_history FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM admins WHERE is_active = true));

-- ====================================================
-- Indexes
-- ====================================================

CREATE INDEX idx_delivery_timelines_status ON delivery_timelines(status);
CREATE INDEX idx_delivery_timelines_department ON delivery_timelines(department);
CREATE INDEX idx_delivery_timelines_display_order ON delivery_timelines(display_order);
CREATE INDEX idx_procurement_steps_status ON procurement_steps(status);
CREATE INDEX idx_procurement_steps_display_order ON procurement_steps(display_order);
CREATE INDEX idx_faqs_status ON faqs(status);
CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_faqs_display_order ON faqs(display_order);
CREATE INDEX idx_audit_log_table ON audit_log(table_name);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- ====================================================
-- Insert default site information row
-- ====================================================

INSERT INTO site_information (id, version, last_updated, contact_email, office, working_hours, homepage_notice, support_message)
VALUES (
  1,
  '1.0',
  'August 2026',
  'supplychain@example.com',
  'Supply Chain Department',
  'Monday to Friday, 08:00–17:00',
  '',
  'If you cannot find the answer to your question, please contact the Supply Chain team directly.'
)
ON CONFLICT (id) DO NOTHING;

-- ====================================================
-- Seed data: Delivery Timelines
-- ====================================================

INSERT INTO delivery_timelines (department, category, item, estimated_lead_time, requirements, notes, status, display_order) VALUES
('Information Technology', 'Computers and Accessories', 'Laptop', '4–6 weeks', 'Approved specification, approved budget and completed request', 'Subject to supplier stock and model availability', 'published', 1),
('Information Technology', 'Computers and Accessories', 'Desktop Computer', '4–6 weeks', 'Approved technical specification and budget', 'Delivery may depend on configuration requirements', 'published', 2),
('Information Technology', 'Printers and Office Technology', 'Printer', '3–6 weeks', 'Approved specification and confirmation of intended use', 'Specialised models may take longer', 'published', 3),
('Information Technology', 'Software and Licences', 'Software Licence', '1–4 weeks', 'Business justification, user count and approval', 'Timelines depend on vendor onboarding and licence terms', 'published', 4),
('Administration', 'Stationery and Consumables', 'Office Stationery', '3–10 working days', 'Approved request and item quantities', 'Standard stocked items may be delivered faster', 'published', 5),
('Administration', 'Office Furniture', 'Office Chair', '3–8 weeks', 'Approved specification and quantity', 'Custom or imported furniture may take longer', 'published', 6),
('Administration', 'Office Furniture', 'Office Desk', '4–8 weeks', 'Approved dimensions, specification and quantity', 'Installation time may need to be scheduled separately', 'published', 7),
('Network Operations', 'Power Systems', 'Generator', '8–20 weeks', 'Approved technical specification, site information and budget', 'Lead time may include manufacturing, importation and installation', 'published', 8),
('Network Operations', 'Power Systems', 'Site Batteries', '6–16 weeks', 'Approved technical specification and quantity', 'Availability may depend on manufacturer production schedules', 'published', 9),
('Network Operations', 'Network Infrastructure', 'Network Equipment', '6–16 weeks', 'Approved bill of materials and technical specification', 'Import and configuration requirements may affect delivery', 'published', 10),
('Fleet', 'Tyres and Batteries', 'Vehicle Tyres', '1–4 weeks', 'Vehicle details, tyre specification and approved request', 'Special sizes may require additional sourcing time', 'published', 11),
('Fleet', 'Spare Parts and Maintenance', 'Vehicle Spare Parts', '2–12 weeks', 'Vehicle identification, part number and approved request', 'Lead time depends on local availability and manufacturer supply', 'published', 12),
('Health, Safety and Environment', 'Personal Protective Equipment', 'Personal Protective Equipment', '2–6 weeks', 'Approved specification, sizes and quantities', 'Specialised or branded PPE may take longer', 'published', 13),
('Health, Safety and Environment', 'Fire and Safety Equipment', 'Fire Extinguisher', '2–5 weeks', 'Approved type, capacity and quantity', 'Inspection and certification requirements may apply', 'published', 14),
('Professional Services', 'Consultancy', 'Consultancy Services', '4–12 weeks', 'Approved scope of work, evaluation criteria and budget', 'Complex assignments may require a formal tender process', 'published', 15),
('Professional Services', 'Training', 'External Training', '3–8 weeks', 'Approved training request, participant list and budget', 'Timing depends on provider availability and travel requirements', 'published', 16);

-- ====================================================
-- Seed data: Procurement Steps
-- ====================================================

INSERT INTO procurement_steps (step_number, title, description, responsible_party, expected_duration, notes, status, display_order) VALUES
(1, 'Identify the Requirement', 'The requester identifies the goods or services required and defines the business need.', 'Requester', '1 working day', '', 'published', 1),
(2, 'Prepare the Request', 'The requester prepares the required specifications, scope of work, supporting documents and budget information.', 'Requester', '1–3 working days', '', 'published', 2),
(3, 'Obtain Approval', 'The request is reviewed and approved in accordance with the applicable approval process.', 'Approver', '1–3 working days', '', 'published', 3),
(4, 'Procurement Review', 'Supply Chain checks the request for completeness, confirms the sourcing approach and requests clarification where necessary.', 'Supply Chain', '1–2 working days', '', 'published', 4),
(5, 'Supplier Sourcing', 'Quotations, proposals or tender responses are obtained and evaluated according to the procurement method.', 'Supply Chain and evaluation team', 'Depends on procurement method', '', 'published', 5),
(6, 'Purchase Order or Contract', 'The selected supplier is formally engaged through an approved purchase order or contract.', 'Supply Chain', '1–5 working days', '', 'published', 6),
(7, 'Supplier Delivery', 'The supplier prepares and delivers the goods or performs the approved services.', 'Supplier', 'Depends on item or service', '', 'published', 7),
(8, 'Receipt and Confirmation', 'The goods or services are inspected, received and confirmed by the responsible team.', 'Requester or receiving team', '1–2 working days', '', 'published', 8);

-- ====================================================
-- Seed data: FAQs
-- ====================================================

INSERT INTO faqs (question, answer, category, status, display_order) VALUES
('How do I request goods or services?', 'Begin by clearly defining the requirement, confirming the available budget and preparing the necessary specifications or scope of work. Submit the request through the approved internal process before Supply Chain begins sourcing.', 'Requests', 'published', 1),
('When does the procurement timeline begin?', 'The procurement timeline normally begins when Supply Chain receives a complete and approved request with all required supporting information.', 'Timelines', 'published', 2),
('Why can delivery take longer than the published estimate?', 'Delivery may be affected by incomplete specifications, delayed approvals, supplier stock availability, importation, manufacturing schedules, technical complexity or changes to the original requirement.', 'Timelines', 'published', 3),
('Can I select my preferred supplier?', 'You may provide relevant supplier information where appropriate, but supplier selection must follow the approved procurement process and evaluation requirements.', 'Suppliers', 'published', 4),
('Why are quotations required?', 'Quotations support fair competition, price comparison, transparency and value-for-money decisions.', 'Sourcing', 'published', 5),
('What happens after my request is approved?', 'Supply Chain reviews the request, confirms the appropriate sourcing method, obtains quotations or proposals where required, completes the evaluation and issues the applicable purchase order or contract.', 'Process', 'published', 6),
('What information should I provide with my request?', 'Provide a clear description, complete specification or scope of work, required quantity, delivery location, business justification, budget information and any relevant supporting documents.', 'Requests', 'published', 7),
('How can I check the expected delivery time?', 'Use the Delivery Timelines page to search for the relevant item or service. The displayed lead time is indicative and may vary depending on the circumstances of the request.', 'Timelines', 'published', 8),
('Who should I contact if my question is not answered?', 'Use the Contact Supply Chain page to find the appropriate support details.', 'Support', 'published', 9);
