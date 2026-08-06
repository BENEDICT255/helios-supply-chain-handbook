import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminUser } from '@/lib/authAdmin';
import { applyImportBatch } from '@/services/importEngine';
import type { WorkbookDiffSummary } from '@/services/excelDiff';

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
    const { batchId, diffSummary, publishImmediately } = body as {
      batchId: string;
      diffSummary: WorkbookDiffSummary;
      publishImmediately?: boolean;
    };

    if (!batchId || !diffSummary) {
      return NextResponse.json({ error: 'Missing required import parameters' }, { status: 400 });
    }

    const result = await applyImportBatch({
      batchId,
      userId: activeUser.id,
      userEmail: activeUser.email || '',
      diffSummary,
      publishImmediately: !!publishImmediately,
      supabaseClient: supabase,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('Excel Import Route Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to apply import batch' },
      { status: 500 }
    );
  }
}
