'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { getImportBatchById } from '@/services/importEngine';
import type { DbImportBatch, DbDataSnapshot } from '@/types/database';

export default function ImportBatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [batch, setBatch] = useState<DbImportBatch | null>(null);
  const [snapshots, setSnapshots] = useState<DbDataSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rollback state
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [rollbackSuccess, setRollbackSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const res = await getImportBatchById(id);
        setBatch(res.batch);
        setSnapshots(res.snapshots);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load import batch details');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleRollbackConfirm = async () => {
    if (!batch) return;

    setRollingBack(true);
    try {
      const res = await fetch('/api/admin/excel/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: batch.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rollback failed');

      setBatch(data.batch);
      setRollbackSuccess('Batch successfully rolled back! Original database snapshot restored.');
      setShowRollbackModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Rollback failed');
    } finally {
      setRollingBack(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <AdminHeader
        title="Import Batch Details"
        description="Detailed validation log, change summary, snapshot backup, and rollback action."
      />

      <div className="flex items-center justify-between">
        <Link
          href="/admin/import-history"
          className="text-xs font-bold text-[var(--primary-blue)] hover:underline"
        >
          ← Back to Import History
        </Link>

        {batch && (batch.status === 'applied' || batch.status === 'published') && (
          <button
            type="button"
            onClick={() => setShowRollbackModal(true)}
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors shadow-2xs"
          >
            Rollback Import Batch
          </button>
        )}
      </div>

      {rollbackSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
          ✓ {rollbackSuccess}
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading batch details..." />
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          Error: {error}
        </div>
      ) : !batch ? (
        <div className="text-center py-8 text-xs text-gray-500">Batch record not found.</div>
      ) : (
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="rounded-xl border border-[var(--border-grey)] bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">{batch.file_name}</h2>
                <p className="text-xs text-[var(--text-muted)]">Uploaded on {new Date(batch.uploaded_at).toLocaleString()}</p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase ${
                  batch.status === 'published'
                    ? 'bg-purple-100 text-purple-800'
                    : batch.status === 'applied'
                    ? 'bg-emerald-100 text-emerald-800'
                    : batch.status === 'rolled_back'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {batch.status}
              </span>
            </div>

            <dl className="grid gap-4 sm:grid-cols-3 text-xs">
              <div>
                <dt className="font-semibold text-gray-500">Uploaded By</dt>
                <dd className="font-bold text-[var(--text-primary)]">{batch.uploaded_by_email || 'Admin'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500">Workbook Version</dt>
                <dd className="font-bold text-[var(--text-primary)]">{batch.workbook_version}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500">Pre-Import Snapshots</dt>
                <dd className="font-bold text-[var(--text-primary)]">{snapshots.length} records backed up</dd>
              </div>
            </dl>

            <div className="grid gap-4 sm:grid-cols-4 pt-2 text-center text-xs">
              <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200">
                <span className="block text-emerald-800">Inserts</span>
                <span className="text-base font-bold text-emerald-900">+{batch.proposed_inserts}</span>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
                <span className="block text-blue-800">Updates</span>
                <span className="text-base font-bold text-blue-900">~{batch.proposed_updates}</span>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
                <span className="block text-amber-800">Unpublishes</span>
                <span className="text-base font-bold text-amber-900">{batch.proposed_unpublishes}</span>
              </div>
              <div className="rounded-lg bg-red-50 p-3 border border-red-200">
                <span className="block text-red-800">Deletes</span>
                <span className="text-base font-bold text-red-900">-{batch.proposed_deletes}</span>
              </div>
            </div>
          </div>

          {/* Snapshots Table */}
          <div className="rounded-xl border border-[var(--border-grey)] bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-gray-100 pb-2">
              Pre-Import Data Snapshots ({snapshots.length})
            </h3>
            {snapshots.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No pre-import snapshots created for this batch.</p>
            ) : (
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#F8FAFC] text-[10px] font-bold uppercase text-[var(--text-muted)] border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2">Table</th>
                      <th className="px-3 py-2">Record ID</th>
                      <th className="px-3 py-2">Backup Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {snapshots.map((snap) => (
                      <tr key={snap.id}>
                        <td className="px-3 py-2 font-bold text-[var(--text-primary)]">{snap.table_name}</td>
                        <td className="px-3 py-2 text-gray-600">{snap.record_id}</td>
                        <td className="px-3 py-2 uppercase font-bold text-blue-700">{snap.action_type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rollback Confirmation Modal */}
      <ConfirmDialog
        isOpen={showRollbackModal}
        onClose={() => setShowRollbackModal(false)}
        onConfirm={handleRollbackConfirm}
        title="Rollback Import Batch"
        message={`Are you sure you want to rollback batch "${batch?.file_name}"? This will restore the database records to their pre-import snapshot values.`}
        confirmLabel="Rollback Batch"
        loading={rollingBack}
      />
    </div>
  );
}
