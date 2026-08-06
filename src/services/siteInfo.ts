import { createClient } from '@/lib/supabase/client';
import type { DbSiteInformation } from '@/types/database';
import type { SiteInfoFormData } from '@/lib/validations/site-info';

export async function getSiteInformation(): Promise<DbSiteInformation | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('site_information')
    .select('*')
    .eq('id', 1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message || 'Failed to fetch site information');
  }
  return data as DbSiteInformation | null;
}

export async function updateSiteInformation(
  formData: SiteInfoFormData,
  userId: string
): Promise<DbSiteInformation> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('site_information')
    .upsert({
      id: 1,
      ...formData,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message || 'Failed to update site information');
  return data as DbSiteInformation;
}
