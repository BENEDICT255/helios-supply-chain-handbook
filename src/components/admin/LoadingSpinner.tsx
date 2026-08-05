'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export default function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-[var(--border-grey)] border-t-[var(--primary-blue)]`}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="text-sm text-[var(--text-muted)]">{message}</p>
      )}
    </div>
  );
}
