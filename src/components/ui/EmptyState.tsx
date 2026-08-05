import React from 'react';
import { SearchIcon } from '@/components/icons/Icons';

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export default function EmptyState({
  title = 'No results found',
  message = 'Try adjusting your search or filters to find what you are looking for.',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-grey)] bg-[var(--light-grey)] px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--pale-blue)]">
        <SearchIcon size={24} className="text-[var(--primary-blue)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--text-muted)]">{message}</p>
    </div>
  );
}
