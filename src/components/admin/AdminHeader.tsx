'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface AdminHeaderProps {
  title: string;
  description?: string;
}

export default function AdminHeader({ title, description }: AdminHeaderProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin/login');
  };

  return (
    <header className="border-b border-[var(--border-grey)] bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{title}</h1>
          {description && (
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <span className="hidden text-xs text-[var(--text-muted)] sm:block">
              {user.email}
            </span>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md border border-[var(--border-grey)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--light-grey)] hover:text-[var(--text-primary)] transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
