import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminUser } from '@/lib/authAdmin';
import { parseAndValidateWorkbook } from '@/services/excelParser';
import { computeWorkbookDiffs } from '@/services/excelDiff';
import { createImportBatchRecord } from '@/services/importEngine';
import { getAllDeliveryTimelines } from '@/services/deliveryTimelines';
import { getAllProcurementSteps } from '@/services/procurementSteps';

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
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 1: Strict Parsing & 28-point Validation
    const validationSummary = parseAndValidateWorkbook(buffer, file.name);

    if (validationSummary.hasBlockingErrors) {
      return NextResponse.json(
        {
          validationSummary,
          diffSummary: null,
          batchId: null,
          message: 'Workbook validation failed with blocking errors',
        },
        { status: 422 }
      );
    }

    // Step 2: Fetch current DB state
    const currentDeliveryTimelines = await getAllDeliveryTimelines();
    const currentProcurementSteps = await getAllProcurementSteps();

    // Step 3: Compute Diffs
    const diffSummary = computeWorkbookDiffs({
      parsedDeliveryRows: validationSummary.parsedDeliveryRows,
      parsedProcurementRows: validationSummary.parsedProcurementRows,
      dbDeliveryTimelines: currentDeliveryTimelines,
      dbProcurementSteps: currentProcurementSteps,
    });

    // Step 4: Create Import Batch Record in DB
    const batchRecord = await createImportBatchRecord({
      fileName: file.name,
      userId: activeUser.id,
      userEmail: activeUser.email || '',
      validationSummary,
      diffSummary,
    });

    return NextResponse.json({
      success: true,
      batchId: batchRecord.id,
      validationSummary,
      diffSummary,
    });
  } catch (err) {
    console.error('Excel Upload Route Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to process Excel upload' },
      { status: 500 }
    );
  }
}
