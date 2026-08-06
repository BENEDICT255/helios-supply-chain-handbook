import { createClient } from '@/lib/supabase/client';
import type { DbImportBatch, DbDataSnapshot } from '@/types/database';
import type { ValidationSummary } from './excelParser';
import type { WorkbookDiffSummary } from './excelDiff';
import { logAuditEntry } from './auditLog';

const supabase = createClient();

/**
 * Creates a new import batch record in Supabase database.
 */
export async function createImportBatchRecord(params: {
  fileName: string;
  userId: string;
  userEmail: string;
  validationSummary: ValidationSummary;
  diffSummary?: WorkbookDiffSummary;
}): Promise<DbImportBatch> {
  const { fileName, userId, userEmail, validationSummary, diffSummary } = params;

  const status = validationSummary.hasBlockingErrors
    ? 'validation_failed'
    : 'ready_for_review';

  const { data, error } = await supabase
    .from('import_batches')
    .insert({
      file_name: fileName,
      workbook_version: validationSummary.workbookVersion || '1.0',
      uploaded_by: userId,
      uploaded_by_email: userEmail,
      status,
      total_rows: validationSummary.totalDeliveryRows + validationSummary.totalProcurementRows,
      valid_rows: validationSummary.validDeliveryRows + validationSummary.validProcurementRows,
      invalid_rows:
        validationSummary.totalDeliveryRows +
        validationSummary.totalProcurementRows -
        (validationSummary.validDeliveryRows + validationSummary.validProcurementRows),
      warning_count: validationSummary.warnings.length,
      proposed_inserts: diffSummary?.proposedInserts || 0,
      proposed_updates: diffSummary?.proposedUpdates || 0,
      proposed_unpublishes: diffSummary?.proposedUnpublishes || 0,
      proposed_deletes: diffSummary?.proposedDeletes || 0,
      validation_summary: validationSummary as unknown as Record<string, unknown>,
    })
    .select()
    .single();

  if (error) throw error;
  return data as DbImportBatch;
}

/**
 * Applies a confirmed import batch to the database with snapshot creation & audit trail.
 */
export async function applyImportBatch(params: {
  batchId: string;
  userId: string;
  userEmail: string;
  diffSummary: WorkbookDiffSummary;
  publishImmediately?: boolean;
}): Promise<DbImportBatch> {
  const { batchId, userId, userEmail, diffSummary, publishImmediately = false } = params;

  // 1. Create Pre-Import Snapshots of all affected DB records
  const snapshotInserts: {
    batch_id: string;
    table_name: string;
    record_id: string;
    snapshot_data: Record<string, unknown>;
    action_type: 'update' | 'delete' | 'unpublish';
    created_by: string;
  }[] = [];

  // Delivery Timelines Updates & Deletes
  for (const item of diffSummary.deliveryTimelines) {
    if (item.type === 'update' && item.dbRecord) {
      snapshotInserts.push({
        batch_id: batchId,
        table_name: 'delivery_timelines',
        record_id: item.dbRecord.id,
        snapshot_data: item.dbRecord as unknown as Record<string, unknown>,
        action_type: 'update',
        created_by: userId,
      });
    } else if (item.type === 'missing' && item.dbRecord) {
      if (item.userChoice === 'delete') {
        snapshotInserts.push({
          batch_id: batchId,
          table_name: 'delivery_timelines',
          record_id: item.dbRecord.id,
          snapshot_data: item.dbRecord as unknown as Record<string, unknown>,
          action_type: 'delete',
          created_by: userId,
        });
      } else if (item.userChoice === 'unpublish') {
        snapshotInserts.push({
          batch_id: batchId,
          table_name: 'delivery_timelines',
          record_id: item.dbRecord.id,
          snapshot_data: item.dbRecord as unknown as Record<string, unknown>,
          action_type: 'unpublish',
          created_by: userId,
        });
      }
    }
  }

  // Procurement Steps Updates & Deletes
  for (const step of diffSummary.procurementSteps) {
    if (step.type === 'update' && step.dbRecord) {
      snapshotInserts.push({
        batch_id: batchId,
        table_name: 'procurement_steps',
        record_id: step.dbRecord.id,
        snapshot_data: step.dbRecord as unknown as Record<string, unknown>,
        action_type: 'update',
        created_by: userId,
      });
    } else if (step.type === 'missing' && step.dbRecord) {
      if (step.userChoice === 'delete') {
        snapshotInserts.push({
          batch_id: batchId,
          table_name: 'procurement_steps',
          record_id: step.dbRecord.id,
          snapshot_data: step.dbRecord as unknown as Record<string, unknown>,
          action_type: 'delete',
          created_by: userId,
        });
      } else if (step.userChoice === 'unpublish') {
        snapshotInserts.push({
          batch_id: batchId,
          table_name: 'procurement_steps',
          record_id: step.dbRecord.id,
          snapshot_data: step.dbRecord as unknown as Record<string, unknown>,
          action_type: 'unpublish',
          created_by: userId,
        });
      }
    }
  }

  if (snapshotInserts.length > 0) {
    const { error: snapshotError } = await supabase.from('data_snapshots').insert(snapshotInserts);
    if (snapshotError) throw new Error(`Snapshot backup failed: ${snapshotError.message}`);
  }

  // 2. Apply Mutations
  const overrideStatus = publishImmediately ? 'published' : undefined;

  // Delivery Timelines Inserts
  for (const item of diffSummary.deliveryTimelines) {
    if (item.type === 'insert' && item.parsedRow) {
      const row = item.parsedRow;
      const { data: created, error } = await supabase
        .from('delivery_timelines')
        .insert({
          department: row.department,
          category: row.category,
          item: row.item,
          estimated_lead_time: row.estimatedLeadTime,
          requirements: row.requirements,
          notes: row.notes,
          status: overrideStatus || row.status,
          display_order: row.displayOrder,
          created_by: userId,
          updated_by: userId,
        })
        .select()
        .single();

      if (!error && created) {
        await logAuditEntry({
          userId,
          userEmail,
          tableName: 'delivery_timelines',
          recordId: created.id,
          action: 'create',
          newData: created,
        });
      }
    } else if (item.type === 'update' && item.parsedRow && item.dbRecord) {
      const row = item.parsedRow;
      const { data: updated, error } = await supabase
        .from('delivery_timelines')
        .update({
          department: row.department,
          category: row.category,
          item: row.item,
          estimated_lead_time: row.estimatedLeadTime,
          requirements: row.requirements,
          notes: row.notes,
          status: overrideStatus || row.status,
          display_order: row.displayOrder,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.dbRecord.id)
        .select()
        .single();

      if (!error && updated) {
        await logAuditEntry({
          userId,
          userEmail,
          tableName: 'delivery_timelines',
          recordId: item.dbRecord.id,
          action: 'update',
          oldData: item.dbRecord as unknown as Record<string, unknown>,
          newData: updated,
        });
      }
    } else if (item.type === 'missing' && item.dbRecord) {
      if (item.userChoice === 'delete') {
        const { error } = await supabase.from('delivery_timelines').delete().eq('id', item.dbRecord.id);
        if (!error) {
          await logAuditEntry({
            userId,
            userEmail,
            tableName: 'delivery_timelines',
            recordId: item.dbRecord.id,
            action: 'delete',
            oldData: item.dbRecord as unknown as Record<string, unknown>,
          });
        }
      } else if (item.userChoice === 'unpublish') {
        const { data: updated, error } = await supabase
          .from('delivery_timelines')
          .update({ status: 'draft', updated_by: userId, updated_at: new Date().toISOString() })
          .eq('id', item.dbRecord.id)
          .select()
          .single();

        if (!error && updated) {
          await logAuditEntry({
            userId,
            userEmail,
            tableName: 'delivery_timelines',
            recordId: item.dbRecord.id,
            action: 'unpublish',
            oldData: item.dbRecord as unknown as Record<string, unknown>,
            newData: updated,
          });
        }
      }
    }
  }

  // Procurement Steps Inserts & Updates
  for (const step of diffSummary.procurementSteps) {
    if (step.type === 'insert' && step.parsedRow) {
      const row = step.parsedRow;
      const { data: created, error } = await supabase
        .from('procurement_steps')
        .insert({
          step_number: row.stepNumber,
          title: row.title,
          description: row.description,
          responsible_party: row.responsibleParty,
          expected_duration: row.expectedDuration,
          notes: row.notes,
          status: overrideStatus || row.status,
          display_order: row.displayOrder,
          created_by: userId,
          updated_by: userId,
        })
        .select()
        .single();

      if (!error && created) {
        await logAuditEntry({
          userId,
          userEmail,
          tableName: 'procurement_steps',
          recordId: created.id,
          action: 'create',
          newData: created,
        });
      }
    } else if (step.type === 'update' && step.parsedRow && step.dbRecord) {
      const row = step.parsedRow;
      const { data: updated, error } = await supabase
        .from('procurement_steps')
        .update({
          step_number: row.stepNumber,
          title: row.title,
          description: row.description,
          responsible_party: row.responsibleParty,
          expected_duration: row.expectedDuration,
          notes: row.notes,
          status: overrideStatus || row.status,
          display_order: row.displayOrder,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', step.dbRecord.id)
        .select()
        .single();

      if (!error && updated) {
        await logAuditEntry({
          userId,
          userEmail,
          tableName: 'procurement_steps',
          recordId: step.dbRecord.id,
          action: 'update',
          oldData: step.dbRecord as unknown as Record<string, unknown>,
          newData: updated,
        });
      }
    } else if (step.type === 'missing' && step.dbRecord) {
      if (step.userChoice === 'delete') {
        const { error } = await supabase.from('procurement_steps').delete().eq('id', step.dbRecord.id);
        if (!error) {
          await logAuditEntry({
            userId,
            userEmail,
            tableName: 'procurement_steps',
            recordId: step.dbRecord.id,
            action: 'delete',
            oldData: step.dbRecord as unknown as Record<string, unknown>,
          });
        }
      } else if (step.userChoice === 'unpublish') {
        const { data: updated, error } = await supabase
          .from('procurement_steps')
          .update({ status: 'draft', updated_by: userId, updated_at: new Date().toISOString() })
          .eq('id', step.dbRecord.id)
          .select()
          .single();

        if (!error && updated) {
          await logAuditEntry({
            userId,
            userEmail,
            tableName: 'procurement_steps',
            recordId: step.dbRecord.id,
            action: 'unpublish',
            oldData: step.dbRecord as unknown as Record<string, unknown>,
            newData: updated,
          });
        }
      }
    }
  }

  // Update Batch Record Status
  const finalStatus = publishImmediately ? 'published' : 'applied';
  const now = new Date().toISOString();

  const { data: updatedBatch, error: batchUpdateError } = await supabase
    .from('import_batches')
    .update({
      status: finalStatus,
      confirmed_by: userId,
      confirmed_at: now,
      published_at: publishImmediately ? now : null,
      rollback_status: 'eligible',
      updated_at: now,
    })
    .eq('id', batchId)
    .select()
    .single();

  if (batchUpdateError) throw batchUpdateError;
  return updatedBatch as DbImportBatch;
}

/**
 * Rollback an import batch using pre-import snapshots.
 */
export async function rollbackImportBatch(params: {
  batchId: string;
  userId: string;
  userEmail: string;
}): Promise<DbImportBatch> {
  const { batchId, userId, userEmail } = params;

  // 1. Fetch snapshots for this batch
  const { data: snapshots, error: snapshotError } = await supabase
    .from('data_snapshots')
    .select('*')
    .eq('batch_id', batchId);

  if (snapshotError) throw snapshotError;
  const snapshotList = (snapshots as DbDataSnapshot[]) || [];

  if (snapshotList.length === 0) {
    throw new Error('No pre-import snapshot data available for this batch.');
  }

  // 2. Restore records from snapshots
  for (const snapshot of snapshotList) {
    const table = snapshot.table_name;
    const recordData = snapshot.snapshot_data;

    if (snapshot.action_type === 'update' || snapshot.action_type === 'unpublish') {
      const { error } = await supabase
        .from(table)
        .update({
          ...recordData,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq('id', snapshot.record_id);

      if (!error) {
        await logAuditEntry({
          userId,
          userEmail,
          tableName: table,
          recordId: snapshot.record_id,
          action: 'update',
          newData: recordData,
        });
      }
    } else if (snapshot.action_type === 'delete') {
      // Re-insert deleted row
      const { error } = await supabase.from(table).insert({
        ...recordData,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      });

      if (!error) {
        await logAuditEntry({
          userId,
          userEmail,
          tableName: table,
          recordId: snapshot.record_id,
          action: 'create',
          newData: recordData,
        });
      }
    }
  }

  // 3. Update Batch Record
  const now = new Date().toISOString();
  const { data: updatedBatch, error: batchError } = await supabase
    .from('import_batches')
    .update({
      status: 'rolled_back',
      rollback_status: 'rolled_back',
      rolled_back_by: userId,
      rolled_back_at: now,
      updated_at: now,
    })
    .eq('id', batchId)
    .select()
    .single();

  if (batchError) throw batchError;
  return updatedBatch as DbImportBatch;
}

/**
 * Fetch all import batches for the import history screen.
 */
export async function getAllImportBatches(): Promise<DbImportBatch[]> {
  const { data, error } = await supabase
    .from('import_batches')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as DbImportBatch[]) || [];
}

/**
 * Fetch a single import batch by ID with its snapshots.
 */
export async function getImportBatchById(batchId: string): Promise<{
  batch: DbImportBatch;
  snapshots: DbDataSnapshot[];
}> {
  const { data: batch, error: batchError } = await supabase
    .from('import_batches')
    .select('*')
    .eq('id', batchId)
    .single();

  if (batchError) throw batchError;

  const { data: snapshots, error: snapshotError } = await supabase
    .from('data_snapshots')
    .select('*')
    .eq('batch_id', batchId);

  if (snapshotError) throw snapshotError;

  return {
    batch: batch as DbImportBatch,
    snapshots: (snapshots as DbDataSnapshot[]) || [],
  };
}
