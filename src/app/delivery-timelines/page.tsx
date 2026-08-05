import React from 'react';
import { Metadata } from 'next';
import PageHeader from '@/components/ui/PageHeader';
import DeliveryTimelineExplorer from '@/components/delivery/DeliveryTimelineExplorer';
import NoticeBox from '@/components/ui/NoticeBox';
import { deliveryTimelines, departments } from '@/data/deliveryTimelines';

export const metadata: Metadata = {
  title: 'Delivery Timelines',
  description:
    'Search or browse the indicative lead times for commonly requested goods and services across Helios Towers departments.',
};

export default function DeliveryTimelinesPage() {
  return (
    <>
      <PageHeader
        title="Delivery Timelines"
        description="Search or browse the indicative lead times for commonly requested goods and services."
      />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        {/* Lead time notice */}
        <NoticeBox>
          Lead times are indicative and may vary based on approvals, supplier availability, specifications, import requirements and market conditions.
        </NoticeBox>

        {/* Searchable and Filterable Explorer */}
        <DeliveryTimelineExplorer
          items={deliveryTimelines}
          departments={departments}
        />
      </div>
    </>
  );
}
