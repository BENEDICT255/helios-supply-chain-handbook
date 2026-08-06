// Database row types matching the Supabase schema

export interface DbDeliveryTimeline {
  id: string;
  department: string;
  category: string;
  item: string;
  estimated_lead_time: string;
  requirements: string;
  notes: string;
  status: 'published' | 'draft';
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface DbProcurementStep {
  id: string;
  step_number: number;
  title: string;
  description: string;
  responsible_party: string;
  expected_duration: string;
  notes: string;
  status: 'published' | 'draft';
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface DbFaq {
  id: string;
  question: string;
  answer: string;
  category: string;
  status: 'published' | 'draft';
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface DbSiteInformation {
  id: number;
  version: string;
  last_updated: string;
  contact_email: string;
  office: string;
  working_hours: string;
  homepage_notice: string;
  support_message: string;
  updated_at: string;
  updated_by: string | null;
}

export interface DbAdmin {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbAuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  table_name: string;
  record_id: string;
  action: 'create' | 'update' | 'delete' | 'publish' | 'unpublish';
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

export interface DbImportHistory {
  id: string;
  user_id: string | null;
  user_email: string | null;
  file_name: string;
  table_name: string;
  records_imported: number;
  records_failed: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_details: Record<string, unknown> | null;
  created_at: string;
}

export type BatchStatus =
  | 'uploaded'
  | 'validating'
  | 'validation_failed'
  | 'ready_for_review'
  | 'draft'
  | 'applying'
  | 'applied'
  | 'published'
  | 'failed'
  | 'rolled_back';

export interface DbImportBatch {
  id: string;
  file_name: string;
  workbook_version: string;
  uploaded_by: string | null;
  uploaded_by_email: string | null;
  uploaded_at: string;
  status: BatchStatus;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  warning_count: number;
  proposed_inserts: number;
  proposed_updates: number;
  proposed_unpublishes: number;
  proposed_deletes: number;
  confirmed_by: string | null;
  confirmed_at: string | null;
  published_at: string | null;
  rollback_status: 'none' | 'eligible' | 'rolled_back' | 'conflict_blocked';
  rolled_back_by: string | null;
  rolled_back_at: string | null;
  validation_summary: Record<string, unknown> | null;
  original_file_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbDataSnapshot {
  id: string;
  batch_id: string;
  table_name: string;
  record_id: string;
  snapshot_data: Record<string, unknown>;
  action_type: 'update' | 'delete' | 'unpublish';
  created_by: string | null;
  created_at: string;
}
