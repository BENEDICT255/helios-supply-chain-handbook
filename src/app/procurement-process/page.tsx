import React from 'react';
import { Metadata } from 'next';
import PageHeader from '@/components/ui/PageHeader';
import ProcessTimeline from '@/components/procurement/ProcessTimeline';
import NoticeBox from '@/components/ui/NoticeBox';
import ButtonLink from '@/components/ui/ButtonLink';
import { getPublishedProcurementSteps } from '@/services/procurementSteps';
import { procurementSteps as fallbackSteps } from '@/data/procurementSteps';
import type { ProcurementStep } from '@/types';

export const metadata: Metadata = {
  title: 'Procurement Process',
  description:
    'Understand what happens from the moment a business requirement is identified until the requested goods or services are delivered and received.',
};

export const revalidate = 0; // Dynamic server fetching

export default async function ProcurementProcessPage() {
  let steps: ProcurementStep[] = [];

  try {
    const dbSteps = await getPublishedProcurementSteps();
    if (dbSteps && dbSteps.length > 0) {
      steps = dbSteps.map((step, idx) => ({
        id: idx + 1,
        title: step.title,
        description: step.description,
        responsibleParty: step.responsible_party || '',
        expectedDuration: step.expected_duration || '',
      }));
    } else {
      steps = fallbackSteps;
    }
  } catch (err) {
    console.error('Supabase fetch fallback to static data:', err);
    steps = fallbackSteps;
  }

  return (
    <>
      <PageHeader
        title="Procurement Process"
        description="Understand what happens from the moment a business requirement is identified until the requested goods or services are delivered and received."
      />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
        {/* Notice box */}
        <NoticeBox>
          The durations shown are indicative only. Actual timelines may vary depending on request completeness, approvals, sourcing requirements, supplier availability, importation and technical complexity.
        </NoticeBox>

        {/* Timeline representation */}
        <ProcessTimeline steps={steps} />

        {/* Action Link */}
        <div className="flex justify-center pt-4">
          <ButtonLink href="/delivery-timelines" variant="primary" id="procurement-view-timelines">
            View Delivery Timelines
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
