import React from 'react';
import { DeliveryTimelineItem } from '@/types';
import { ClockSmallIcon } from '@/components/icons/Icons';

interface DeliveryItemTableProps {
  items: DeliveryTimelineItem[];
}

export default function DeliveryItemTable({ items }: DeliveryItemTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-grey)] bg-white shadow-xs">
      <table className="w-full text-left text-sm text-[var(--text-primary)]">
        <thead className="bg-[var(--light-grey)] text-xs uppercase font-semibold text-[var(--text-muted)] border-b border-[var(--border-grey)]">
          <tr>
            <th scope="col" className="px-6 py-4">
              Item & Category
            </th>
            <th scope="col" className="px-6 py-4">
              Department
            </th>
            <th scope="col" className="px-6 py-4">
              Estimated Lead Time
            </th>
            <th scope="col" className="px-6 py-4">
              Requirements
            </th>
            <th scope="col" className="px-6 py-4">
              Notes
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-grey)]">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-[var(--pale-blue)]/30 transition-colors">
              <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">
                <div>{item.item}</div>
                <div className="text-xs font-normal text-[var(--text-muted)]">{item.category}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-block rounded-md bg-[var(--pale-blue)] px-2.5 py-1 text-xs font-medium text-[var(--dark-blue)]">
                  {item.department}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                  <ClockSmallIcon size={14} />
                  {item.estimatedLeadTime}
                </span>
              </td>
              <td className="px-6 py-4 text-xs text-[var(--text-muted)] max-w-xs">
                {item.requirements}
              </td>
              <td className="px-6 py-4 text-xs text-[var(--text-muted)] max-w-xs">
                {item.notes}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
