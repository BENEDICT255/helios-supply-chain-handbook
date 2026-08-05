import React from 'react';
import { InfoIcon } from '@/components/icons/Icons';

interface NoticeBoxProps {
  children: React.ReactNode;
  className?: string;
}

export default function NoticeBox({ children, className = '' }: NoticeBoxProps) {
  return (
    <div
      className={`flex gap-3 rounded-lg border border-[var(--primary-blue)]/20 bg-[var(--pale-blue)] p-4 ${className}`}
      role="note"
    >
      <div className="mt-0.5 shrink-0">
        <InfoIcon size={18} className="text-[var(--primary-blue)]" />
      </div>
      <p className="text-sm text-[var(--text-primary)]">{children}</p>
    </div>
  );
}
