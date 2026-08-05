import React from 'react';
import { Metadata } from 'next';
import PageHeader from '@/components/ui/PageHeader';
import ProcessTimeline from '@/components/procurement/ProcessTimeline';
import NoticeBox from '@/components/ui/NoticeBox';
import ButtonLink from '@/components/ui/ButtonLink';
import { procurementSteps } from '@/data/procurementSteps';

export const metadata: Metadata = {
  title: 'Procurement Process',
  description:
    'Understand what happens from the moment a business requirement is identified until the requested goods or services are delivered and received.',
};

export default function ProcurementProcessPage() {
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
        <ProcessTimeline steps={procurementSteps} />

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
