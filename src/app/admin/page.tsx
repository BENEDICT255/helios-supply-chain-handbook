'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import ExcelPlaceholder from '@/components/admin/ExcelPlaceholder';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import { useDeliveryTimelines } from '@/hooks/useDeliveryTimelines';
import { useProcurementSteps } from '@/hooks/useProcurementSteps';
import { useFaqs } from '@/hooks/useFaqs';
import { getRecentAuditLogs } from '@/services/auditLog';
import type { DbAuditLog } from '@/types/database';

export default function AdminDashboardPage() {
  const { data: timelines, loading: loadingTimelines } = useDeliveryTimelines();
  const { data: steps, loading: loadingSteps } = useProcurementSteps();
  const { data: faqs, loading: loadingFaqs } = useFaqs();

  const [auditLogs, setAuditLogs] = useState<DbAuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const logs = await getRecentAuditLogs(10);
        setAuditLogs(logs);
      } catch (err) {
        console.error('Error loading audit logs:', err);
      } finally {
        setLoadingLogs(false);
      }
    }
    loadLogs();
  }, []);

  const isLoading = loadingTimelines || loadingSteps || loadingFaqs;

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Dashboard"
        description="Overview of handbook content, publishing status, and recent management activity."
      />

      {/* Summary Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Delivery Timelines */}
        <div className="rounded-xl border border-[var(--border-grey)] bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Delivery Timelines</span>
            <svg className="h-5 w-5 text-[var(--primary-blue)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-primary)]">
            {isLoading ? '...' : timelines.length}
          </div>
          <div className="flex justify-between text-xs text-[var(--text-muted)] pt-1 border-t border-gray-100">
            <span>Published: {timelines.filter((t) => t.status === 'published').length}</span>
            <span>Drafts: {timelines.filter((t) => t.status === 'draft').length}</span>
          </div>
          <div className="pt-2">
            <Link
              href="/admin/delivery-timelines"
              className="text-xs font-semibold text-[var(--primary-blue)] hover:underline"
            >
              Manage Timelines →
            </Link>
          </div>
        </div>

        {/* 2. Procurement Steps */}
        <div className="rounded-xl border border-[var(--border-grey)] bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Procurement Steps</span>
            <svg className="h-5 w-5 text-[var(--primary-blue)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
            </svg>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-primary)]">
            {isLoading ? '...' : steps.length}
          </div>
          <div className="flex justify-between text-xs text-[var(--text-muted)] pt-1 border-t border-gray-100">
            <span>Published: {steps.filter((s) => s.status === 'published').length}</span>
            <span>Drafts: {steps.filter((s) => s.status === 'draft').length}</span>
          </div>
          <div className="pt-2">
            <Link
              href="/admin/procurement-steps"
              className="text-xs font-semibold text-[var(--primary-blue)] hover:underline"
            >
              Manage Steps →
            </Link>
          </div>
        </div>

        {/* 3. FAQs */}
        <div className="rounded-xl border border-[var(--border-grey)] bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">FAQs</span>
            <svg className="h-5 w-5 text-[var(--primary-blue)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-primary)]">
            {isLoading ? '...' : faqs.length}
          </div>
          <div className="flex justify-between text-xs text-[var(--text-muted)] pt-1 border-t border-gray-100">
            <span>Published: {faqs.filter((f) => f.status === 'published').length}</span>
            <span>Drafts: {faqs.filter((f) => f.status === 'draft').length}</span>
          </div>
          <div className="pt-2">
            <Link
              href="/admin/faqs"
              className="text-xs font-semibold text-[var(--primary-blue)] hover:underline"
            >
              Manage FAQs →
            </Link>
          </div>
        </div>

        {/* 4. Site Information */}
        <div className="rounded-xl border border-[var(--border-grey)] bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Site Settings</span>
            <svg className="h-5 w-5 text-[var(--primary-blue)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a7.723 7.723 0 0 1 0 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            </svg>
          </div>
          <div className="text-xl font-bold text-[var(--text-primary)]">v1.0</div>
          <div className="text-xs text-[var(--text-muted)] pt-1 border-t border-gray-100">
            Handbook Metadata
          </div>
          <div className="pt-2">
            <Link
              href="/admin/site-information"
              className="text-xs font-semibold text-[var(--primary-blue)] hover:underline"
            >
              Edit Settings →
            </Link>
          </div>
        </div>
      </div>

      {/* Excel Integration Section Placeholder */}
      <ExcelPlaceholder />

      {/* Audit Log Activity History */}
      <div className="rounded-xl border border-[var(--border-grey)] bg-white p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[var(--text-primary)]">Recent Audit History</h2>
        {loadingLogs ? (
          <LoadingSpinner size="sm" message="Loading audit history..." />
        ) : auditLogs.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] py-4 text-center">No recent activity recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-grey)]">
                <tr>
                  <th className="px-3 py-2">Timestamp</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Table</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 font-medium text-[var(--text-primary)]">
                      {log.user_email || 'System'}
                    </td>
                    <td className="px-3 py-2 text-gray-600 font-mono text-[11px]">{log.table_name}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          log.action === 'create'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action === 'update'
                            ? 'bg-blue-100 text-blue-800'
                            : log.action === 'delete'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
