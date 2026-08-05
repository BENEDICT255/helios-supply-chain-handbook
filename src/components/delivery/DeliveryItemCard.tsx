import React from 'react';
import { DeliveryTimelineItem } from '@/types';
import { ClockSmallIcon } from '@/components/icons/Icons';

interface DeliveryItemCardProps {
  item: DeliveryTimelineItem;
}

export default function DeliveryItemCard({ item }: DeliveryItemCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-[var(--border-grey)] bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-block rounded-md bg-[var(--pale-blue)] px-2.5 py-1 text-xs font-semibold text-[var(--dark-blue)]">
            {item.department}
          </span>
          <h3 className="mt-2 text-base font-bold text-[var(--text-primary)]">
            {item.item}
          </h3>
          <p className="text-xs text-[var(--text-muted)]">{item.category}</p>
        </div>
        <div className="shrink-0 text-right">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <ClockSmallIcon size={14} />
            {item.estimatedLeadTime}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-2.5 border-t border-[var(--border-grey)]/60 pt-3 text-xs">
        <div>
          <span className="font-semibold text-[var(--text-primary)]">Requirements: </span>
          <span className="text-[var(--text-muted)]">{item.requirements}</span>
        </div>
        <div>
          <span className="font-semibold text-[var(--text-primary)]">Notes: </span>
          <span className="text-[var(--text-muted)]">{item.notes}</span>
        </div>
      </div>
    </div>
  );
}
