-- ====================================================
-- Helios Supply Chain Handbook — Supabase Schema Migration
-- Phase 3: Bulk Excel Operations, Snapshots & Import History
-- ====================================================

-- 1. Import Batches Table
CREATE TABLE IF NOT EXISTS import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  workbook_version TEXT NOT NULL DEFAULT '1.0',
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_by_email TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (
    status IN (
      'uploaded',
      'validating',
      'validation_failed',
      'ready_for_review',
      'draft',
      'applying',
      'applied',
      'published',
      'failed',
      'rolled_back'
    )
  ),
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  invalid_rows INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  proposed_inserts INTEGER NOT NULL DEFAULT 0,
  proposed_updates INTEGER NOT NULL DEFAULT 0,
  proposed_unpublishes INTEGER NOT NULL DEFAULT 0,
  proposed_deletes INTEGER NOT NULL DEFAULT 0,
  confirmed_by UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  rollback_status TEXT NOT NULL DEFAULT 'none' CHECK (
    rollback_status IN ('none', 'eligible', 'rolled_back', 'conflict_blocked')
  ),
  rolled_back_by UUID REFERENCES auth.users(id),
  rolled_back_at TIMESTAMPTZ,
  validation_summary JSONB,
  original_file_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Pre-Import Data Snapshots (for Rollback support)
CREATE TABLE IF NOT EXISTS data_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  snapshot_data JSONB NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('update', 'delete', 'unpublish')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Authenticated Admin Portal Users
DROP POLICY IF EXISTS "Admins have full access to import batches" ON import_batches;
CREATE POLICY "Admins have full access to import batches"
  ON import_batches FOR ALL
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins have full access to data snapshots" ON data_snapshots;
CREATE POLICY "Admins have full access to data snapshots"
  ON data_snapshots FOR ALL
  USING (auth.role() = 'authenticated');

-- Refresh All Table RLS Policies for Admin Portal Access
DROP POLICY IF EXISTS "Admins have full access to delivery timelines" ON delivery_timelines;
CREATE POLICY "Admins have full access to delivery timelines"
  ON delivery_timelines FOR ALL
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins have full access to procurement steps" ON procurement_steps;
CREATE POLICY "Admins have full access to procurement steps"
  ON procurement_steps FOR ALL
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins have full access to faqs" ON faqs;
CREATE POLICY "Admins have full access to faqs"
  ON faqs FOR ALL
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins have full access to site information" ON site_information;
CREATE POLICY "Admins have full access to site information"
  ON site_information FOR ALL
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can read admins table" ON admins;
CREATE POLICY "Admins can read admins table"
  ON admins FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can read audit log" ON audit_log;
CREATE POLICY "Admins can read audit log"
  ON audit_log FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can insert audit log" ON audit_log;
CREATE POLICY "Admins can insert audit log"
  ON audit_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage import history" ON import_history;
CREATE POLICY "Admins can manage import history"
  ON import_history FOR ALL
  USING (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_import_batches_status ON import_batches(status);
CREATE INDEX IF NOT EXISTS idx_import_batches_created ON import_batches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_snapshots_batch ON data_snapshots(batch_id);
CREATE INDEX IF NOT EXISTS idx_data_snapshots_record ON data_snapshots(table_name, record_id);
