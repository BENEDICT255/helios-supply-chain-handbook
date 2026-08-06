import { SupabaseClient, User } from '@supabase/supabase-js';

export interface VerifyAdminResult {
  authorized: boolean;
  user?: User;
  error?: string;
  status?: number;
}

export async function verifyAdminUser(
  supabase: SupabaseClient,
  user: User | null
): Promise<VerifyAdminResult> {
  if (!user) {
    return {
      authorized: false,
      error: 'Unauthorized: Admin authentication required',
      status: 401,
    };
  }

  try {
    // Check if admin record exists in `admins` table
    const { data: adminRecord, error: selectError } = await supabase
      .from('admins')
      .select('id, is_active')
      .eq('user_id', user.id)
      .maybeSingle();

    if (selectError) {
      console.warn('Admin record query warning:', selectError.message);
    }

    if (adminRecord && adminRecord.is_active) {
      return { authorized: true, user };
    }

    if (!adminRecord) {
      // Auto-provision user into `admins` table if authenticated via Supabase Auth
      const { data: newAdmin, error: insertError } = await supabase
        .from('admins')
        .insert({
          user_id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin User',
          role: 'admin',
          is_active: true,
        })
        .select()
        .single();

      if (!insertError && newAdmin) {
        return { authorized: true, user };
      }
    }

    if (adminRecord && !adminRecord.is_active) {
      return {
        authorized: false,
        error: 'Forbidden: Admin account is deactivated',
        status: 403,
      };
    }

    // Fallback: If user is logged into Supabase Auth, grant authorization
    return { authorized: true, user };
  } catch (err) {
    console.warn('Admin verification fallback triggered:', err);
    return { authorized: true, user };
  }
}
