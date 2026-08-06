import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { verifyAdminUser } from '@/lib/authAdmin';
import { rollbackImportBatch } from '@/services/importEngine';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const authCheck = await verifyAdminUser(supabase, user);
    if (!authCheck.authorized || !authCheck.user) {
      return NextResponse.json(
        { error: authCheck.error || 'Forbidden: Admin access required' },
        { status: authCheck.status || 403 }
      );
    }

    const activeUser = authCheck.user;
    const body = await request.json();
    const { batchId } = body as { batchId: string };

    if (!batchId) {
      return NextResponse.json({ error: 'Missing batchId' }, { status: 400 });
    }

    const result = await rollbackImportBatch({
      batchId,
      userId: activeUser.id,
      userEmail: activeUser.email || '',
      supabaseClient: supabase,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('Excel Rollback Route Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to rollback import batch' },
      { status: 500 }
    );
  }
}
