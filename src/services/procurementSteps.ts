import { createClient } from '@/lib/supabase/client';
import type { DbProcurementStep } from '@/types/database';
import type { ProcurementStepFormData } from '@/lib/validations/procurement';

export async function getAllProcurementSteps(): Promise<DbProcurementStep[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('procurement_steps')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw new Error(error.message || 'Failed to fetch procurement steps');
  return (data as DbProcurementStep[]) ?? [];
}

export async function getPublishedProcurementSteps(): Promise<DbProcurementStep[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('procurement_steps')
    .select('*')
    .eq('status', 'published')
    .order('step_number', { ascending: true });

  if (error) throw new Error(error.message || 'Failed to fetch published procurement steps');
  return (data as DbProcurementStep[]) ?? [];
}

export async function getProcurementStepById(id: string): Promise<DbProcurementStep | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('procurement_steps')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message || 'Failed to fetch procurement step');
  return data as DbProcurementStep;
}

export async function createProcurementStep(
  formData: ProcurementStepFormData,
  userId: string
): Promise<DbProcurementStep> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('procurement_steps')
    .insert({
      ...formData,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message || 'Failed to create procurement step');
  return data as DbProcurementStep;
}

export async function updateProcurementStep(
  id: string,
  formData: Partial<ProcurementStepFormData>,
  userId: string
): Promise<DbProcurementStep> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('procurement_steps')
    .update({
      ...formData,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message || 'Failed to update procurement step');
  return data as DbProcurementStep;
}

export async function deleteProcurementStep(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('procurement_steps')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message || 'Failed to delete procurement step');
}

export async function updateProcurementStepStatus(
  id: string,
  status: 'published' | 'draft',
  userId: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('procurement_steps')
    .update({
      status,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(error.message || 'Failed to update step status');
}

export async function reorderProcurementSteps(
  orderedIds: { id: string; display_order: number; step_number: number }[],
  userId: string
): Promise<void> {
  const supabase = createClient();
  const updates = orderedIds.map(({ id, display_order, step_number }) =>
    supabase
      .from('procurement_steps')
      .update({
        display_order,
        step_number,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message || 'Failed to reorder procurement steps');
}
