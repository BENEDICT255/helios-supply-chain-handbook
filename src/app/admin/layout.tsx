'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <div className="min-h-screen bg-[var(--navy)]">{children}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--light-grey)] text-[var(--text-primary)]">
      {/* Fixed Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <main className="flex-1 p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
