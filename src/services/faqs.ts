import { createClient } from '@/lib/supabase/client';
import type { DbFaq } from '@/types/database';
import type { FaqFormData } from '@/lib/validations/faqs';

export async function getAllFaqs(): Promise<DbFaq[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw new Error(error.message || 'Failed to fetch FAQs');
  return (data as DbFaq[]) ?? [];
}

export async function getPublishedFaqs(): Promise<DbFaq[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('status', 'published')
    .order('display_order', { ascending: true });

  if (error) throw new Error(error.message || 'Failed to fetch published FAQs');
  return (data as DbFaq[]) ?? [];
}

export async function getFaqById(id: string): Promise<DbFaq | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message || 'Failed to fetch FAQ record');
  return data as DbFaq;
}

export async function createFaq(
  formData: FaqFormData,
  userId: string
): Promise<DbFaq> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('faqs')
    .insert({
      ...formData,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message || 'Failed to create FAQ');
  return data as DbFaq;
}

export async function updateFaq(
  id: string,
  formData: Partial<FaqFormData>,
  userId: string
): Promise<DbFaq> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('faqs')
    .update({
      ...formData,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message || 'Failed to update FAQ');
  return data as DbFaq;
}

export async function deleteFaq(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('faqs')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message || 'Failed to delete FAQ');
}

export async function updateFaqStatus(
  id: string,
  status: 'published' | 'draft',
  userId: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('faqs')
    .update({
      status,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(error.message || 'Failed to update FAQ status');
}

export async function getFaqCategories(): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('faqs')
    .select('category')
    .eq('status', 'published');

  if (error) throw new Error(error.message || 'Failed to fetch categories');
  const categories = [...new Set((data ?? []).map((d: { category: string }) => d.category))];
  return categories.sort();
}
