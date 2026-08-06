import { createClient } from '@/lib/supabase/client';
import type { DbDeliveryTimeline } from '@/types/database';
import type { DeliveryTimelineFormData } from '@/lib/validations/delivery';

export async function getAllDeliveryTimelines(): Promise<DbDeliveryTimeline[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('delivery_timelines')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw new Error(error.message || 'Failed to fetch delivery timelines');
  return (data as DbDeliveryTimeline[]) ?? [];
}

export async function getPublishedDeliveryTimelines(): Promise<DbDeliveryTimeline[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('delivery_timelines')
    .select('*')
    .eq('status', 'published')
    .order('display_order', { ascending: true });

  if (error) throw new Error(error.message || 'Failed to fetch published delivery timelines');
  return (data as DbDeliveryTimeline[]) ?? [];
}

export async function getDeliveryTimelineById(id: string): Promise<DbDeliveryTimeline | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('delivery_timelines')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message || 'Failed to fetch delivery timeline record');
  return data as DbDeliveryTimeline;
}

export async function createDeliveryTimeline(
  formData: DeliveryTimelineFormData,
  userId: string
): Promise<DbDeliveryTimeline> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('delivery_timelines')
    .insert({
      ...formData,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message || 'Failed to create delivery timeline');
  return data as DbDeliveryTimeline;
}

export async function updateDeliveryTimeline(
  id: string,
  formData: Partial<DeliveryTimelineFormData>,
  userId: string
): Promise<DbDeliveryTimeline> {
  const supabase = createClient();
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

  if (error) throw new Error(error.message || 'Failed to update delivery timeline');
  return data as DbDeliveryTimeline;
}

export async function deleteDeliveryTimeline(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('delivery_timelines')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message || 'Failed to delete delivery timeline');
}

export async function updateDeliveryTimelineStatus(
  id: string,
  status: 'published' | 'draft',
  userId: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('delivery_timelines')
    .update({
      status,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(error.message || 'Failed to update timeline status');
}

export async function getDeliveryDepartments(): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('delivery_timelines')
    .select('department')
    .eq('status', 'published');

  if (error) throw new Error(error.message || 'Failed to fetch departments');
  const departments = [...new Set((data ?? []).map((d: { department: string }) => d.department))];
  return departments.sort();
}
