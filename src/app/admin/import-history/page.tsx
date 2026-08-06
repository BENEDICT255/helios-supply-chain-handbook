'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import EmptyAdminState from '@/components/admin/EmptyAdminState';
import { getAllImportBatches } from '@/services/importEngine';
import type { DbImportBatch } from '@/types/database';

export default function AdminImportHistoryPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<DbImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBatches() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllImportBatches();
        setBatches(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load import history');
      } finally {
        setLoading(false);
      }
    }
    loadBatches();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      <AdminHeader
        title="Import History"
        description="Audit log of all uploaded workbooks, validation states, applied counts, and snapshot rollback availability."
      />

      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[var(--text-primary)]">All Import Batches</h2>
        <Link
          href="/admin/excel/upload"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary-blue)] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[var(--dark-blue)] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Upload New Workbook
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading import history..." />
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          Error: {error}
        </div>
      ) : batches.length === 0 ? (
        <EmptyAdminState
          title="No Import History"
          message="No Excel workbooks have been uploaded or imported yet."
          actionLabel="Upload Workbook"
          onAction={() => router.push('/admin/excel/upload')}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border-grey)] bg-white shadow-xs">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-grey)]">
              <tr>
                <th className="px-4 py-3.5">Uploaded Date</th>
                <th className="px-4 py-3.5">File Name</th>
                <th className="px-4 py-3.5">Uploaded By</th>
                <th className="px-4 py-3.5">Changes (Ins/Upd/Unp/Del)</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5 whitespace-nowrap text-gray-500">
                    {new Date(batch.uploaded_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-[var(--text-primary)]">
                    {batch.file_name}
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">
                    {batch.uploaded_by_email || 'Admin'}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-gray-700">
                    <span className="text-emerald-700 font-bold">+{batch.proposed_inserts}</span> /{' '}
                    <span className="text-blue-700 font-bold">~{batch.proposed_updates}</span> /{' '}
                    <span className="text-amber-700 font-bold">{batch.proposed_unpublishes}</span> /{' '}
                    <span className="text-red-700 font-bold">-{batch.proposed_deletes}</span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                        batch.status === 'published'
                          ? 'bg-purple-100 text-purple-800'
                          : batch.status === 'applied'
                          ? 'bg-emerald-100 text-emerald-800'
                          : batch.status === 'rolled_back'
                          ? 'bg-red-100 text-red-800'
                          : batch.status === 'ready_for_review'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <Link
                      href={`/admin/import-history/${batch.id}`}
                      className="rounded-md border border-[var(--border-grey)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--primary-blue)] hover:bg-[var(--pale-blue)] transition-colors"
                    >
                      View Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
