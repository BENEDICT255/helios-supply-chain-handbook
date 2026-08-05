'use client';

import React from 'react';

interface StatusBadgeProps {
  status: 'published' | 'draft';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        status === 'published'
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
          : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
      }`}
    >
      {status === 'published' ? 'Published' : 'Draft'}
    </span>
  );
}
