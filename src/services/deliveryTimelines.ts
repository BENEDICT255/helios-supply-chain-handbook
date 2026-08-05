import { createClient } from '@/lib/supabase/client';
import type { DbDeliveryTimeline } from '@/types/database';
import type { DeliveryTimelineFormData } from '@/lib/validations/delivery';

const supabase = createClient();

export async function getAllDeliveryTimelines(): Promise<DbDeliveryTimeline[]> {
  const { data, error } = await supabase
    .from('delivery_timelines')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data as DbDeliveryTimeline[]) ?? [];
}

export async function getPublishedDeliveryTimelines(): Promise<DbDeliveryTimeline[]> {
  const { data, error } = await supabase
    .from('delivery_timelines')
    .select('*')
    .eq('status', 'published')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data as DbDeliveryTimeline[]) ?? [];
}

export async function getDeliveryTimelineById(id: string): Promise<DbDeliveryTimeline | null> {
  const { data, error } = await supabase
    .from('delivery_timelines')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as DbDeliveryTimeline;
}

export async function createDeliveryTimeline(
  formData: DeliveryTimelineFormData,
  userId: string
): Promise<DbDeliveryTimeline> {
  const { data, error } = await supabase
    .from('delivery_timelines')
    .insert({
      ...formData,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as DbDeliveryTimeline;
}

export async function updateDeliveryTimeline(
  id: string,
  formData: Partial<DeliveryTimelineFormData>,
  userId: string
): Promise<DbDeliveryTimeline> {
  const { data, error } = await supabase
    .from('delivery_timelines')
    .update({
      ...formData,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as DbDeliveryTimeline;
}

export async function deleteDeliveryTimeline(id: string): Promise<void> {
  const { error } = await supabase
    .from('delivery_timelines')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateDeliveryTimelineStatus(
  id: string,
  status: 'published' | 'draft',
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('delivery_timelines')
    .update({
      status,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

export async function getDeliveryDepartments(): Promise<string[]> {
  const { data, error } = await supabase
    .from('delivery_timelines')
    .select('department')
    .eq('status', 'published');

  if (error) throw error;
  const departments = [...new Set((data ?? []).map((d: { department: string }) => d.department))];
  return departments.sort();
}
