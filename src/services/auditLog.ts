import { createClient } from '@/lib/supabase/client';
import type { DbAuditLog } from '@/types/database';

const supabase = createClient();

export async function logAuditEntry(params: {
  userId: string;
  userEmail: string;
  tableName: string;
  recordId: string;
  action: DbAuditLog['action'];
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
}) {
  const { error } = await supabase.from('audit_log').insert({
    user_id: params.userId,
    user_email: params.userEmail,
    table_name: params.tableName,
    record_id: params.recordId,
    action: params.action,
    old_data: params.oldData ?? null,
    new_data: params.newData ?? null,
  });

  if (error) {
    console.error('Failed to write audit log:', error);
  }
}

export async function getRecentAuditLogs(limit = 20): Promise<DbAuditLog[]> {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as DbAuditLog[]) ?? [];
}

export async function getAuditLogsByTable(
  tableName: string,
  limit = 50
): Promise<DbAuditLog[]> {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .eq('table_name', tableName)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as DbAuditLog[]) ?? [];
}
