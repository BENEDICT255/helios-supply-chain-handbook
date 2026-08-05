import React, { Suspense } from 'react';
import { Metadata } from 'next';
import PageHeader from '@/components/ui/PageHeader';
import DeliveryTimelineExplorer from '@/components/delivery/DeliveryTimelineExplorer';
import NoticeBox from '@/components/ui/NoticeBox';
import { getPublishedDeliveryTimelines, getDeliveryDepartments } from '@/services/deliveryTimelines';
import { deliveryTimelines as fallbackTimelines, departments as fallbackDepartments } from '@/data/deliveryTimelines';
import type { DeliveryTimelineItem } from '@/types';

export const metadata: Metadata = {
  title: 'Delivery Timelines',
  description:
    'Search or browse the indicative lead times for commonly requested goods and services across Helios Towers departments.',
};

export const revalidate = 0; // Dynamic server fetching

export default async function DeliveryTimelinesPage() {
  let items: DeliveryTimelineItem[] = [];
  let depts: string[] = [];

  try {
    const dbItems = await getPublishedDeliveryTimelines();
    const dbDepts = await getDeliveryDepartments();

    if (dbItems && dbItems.length > 0) {
      items = dbItems.map((item, idx) => ({
        id: idx + 1,
        department: item.department,
        category: item.category,
        item: item.item,
        estimatedLeadTime: item.estimated_lead_time,
        requirements: item.requirements || '',
        notes: item.notes || '',
        status: item.status,
        displayOrder: item.display_order,
      }));
      depts = dbDepts;
    } else {
      items = fallbackTimelines;
      depts = fallbackDepartments;
    }
  } catch (err) {
    console.error('Supabase fetch fallback to static data:', err);
    items = fallbackTimelines;
    depts = fallbackDepartments;
  }

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
        <Suspense fallback={<div className="py-8 text-center text-sm text-gray-500">Loading timelines...</div>}>
          <DeliveryTimelineExplorer
            items={items}
            departments={depts}
          />
        </Suspense>
      </div>
    </>
  );
}
