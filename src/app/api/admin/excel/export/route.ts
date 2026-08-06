import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { verifyAdminUser } from '@/lib/authAdmin';
import { getAllDeliveryTimelines } from '@/services/deliveryTimelines';
import { getAllProcurementSteps } from '@/services/procurementSteps';
import { exportHandbookToBuffer } from '@/services/excelExport';

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const isTemplate = searchParams.get('type') === 'template';

    let deliveryTimelines = undefined;
    let procurementSteps = undefined;

    if (!isTemplate) {
      deliveryTimelines = await getAllDeliveryTimelines();
      procurementSteps = await getAllProcurementSteps();
    }

    const buffer = exportHandbookToBuffer({
      deliveryTimelines,
      procurementSteps,
      generatedBy: activeUser.email || 'Admin',
      isTemplate,
    });

    const currentDate = new Date().toISOString().split('T')[0];
    const filename = isTemplate
      ? 'Helios_Towers_Supply_Chain_Handbook_Blank_Template.xlsx'
      : `Helios_Towers_Supply_Chain_Handbook_${currentDate}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err) {
    console.error('Excel Export Route Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate Excel export' },
      { status: 500 }
    );
  }
}
