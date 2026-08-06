'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import DataTable, { Column } from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import EmptyAdminState from '@/components/admin/EmptyAdminState';
import { useProcurementSteps } from '@/hooks/useProcurementSteps';
import { useAuth } from '@/hooks/useAuth';
import {
  createProcurementStep,
  updateProcurementStep,
  deleteProcurementStep,
  updateProcurementStepStatus,
  reorderProcurementSteps,
} from '@/services/procurementSteps';
import { logAuditEntry } from '@/services/auditLog';
import type { DbProcurementStep } from '@/types/database';
import { procurementStepSchema, ProcurementStepFormData } from '@/lib/validations/procurement';

export default function AdminProcurementStepsPage() {
  const { data, loading, error, refetch } = useProcurementSteps();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const paramHighlight = searchParams.get('highlight');

  // Highlight State for newly inserted records
  const [highlightedId, setHighlightedId] = useState<string | null>(paramHighlight);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DbProcurementStep | null>(null);

  // Form State
  const [formData, setFormData] = useState<ProcurementStepFormData>({
    step_number: 1,
    title: '',
    description: '',
    responsible_party: '',
    expected_duration: '',
    notes: '',
    status: 'draft',
    display_order: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteItem, setDeleteItem] = useState<DbProcurementStep | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Table Columns
  const columns: Column<DbProcurementStep>[] = [
    {
      key: 'step_number',
      header: 'Step #',
      accessor: (item) => (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--pale-blue)] text-xs font-bold text-[var(--primary-blue)]">
          {item.step_number}
        </span>
      ),
      sortable: true,
      searchable: false,
    },
    {
      key: 'title',
      header: 'Title',
      accessor: (item) => <span className="font-bold text-[var(--text-primary)]">{item.title}</span>,
      sortable: true,
      searchable: true,
    },
    {
      key: 'responsible_party',
      header: 'Responsible Party',
      accessor: (item) => <span className="text-gray-700">{item.responsible_party}</span>,
      sortable: true,
      searchable: true,
    },
    {
      key: 'expected_duration',
      header: 'Expected Duration',
      accessor: (item) => <span className="font-medium text-[var(--primary-blue)]">{item.expected_duration}</span>,
      sortable: true,
      searchable: true,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (item) => <StatusBadge status={item.status} />,
      sortable: true,
      searchable: false,
    },
  ];

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    const nextStep = data.length + 1;
    setFormData({
      step_number: nextStep,
      title: '',
      description: '',
      responsible_party: '',
      expected_duration: '',
      notes: '',
      status: 'draft',
      display_order: nextStep,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: DbProcurementStep) => {
    setEditingItem(item);
    setFormData({
      step_number: item.step_number,
      title: item.title,
      description: item.description,
      responsible_party: item.responsible_party || '',
      expected_duration: item.expected_duration || '',
      notes: item.notes || '',
      status: item.status,
      display_order: item.display_order,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const result = procurementStepSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setFormErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        const updated = await updateProcurementStep(editingItem.id, result.data, user?.id || '');
        await logAuditEntry({
          userId: user?.id || '',
          userEmail: user?.email || '',
          tableName: 'procurement_steps',
          recordId: editingItem.id,
          action: 'update',
          oldData: editingItem as unknown as Record<string, unknown>,
          newData: updated as unknown as Record<string, unknown>,
        });
      } else {
        const created = await createProcurementStep(result.data, user?.id || '');
        await logAuditEntry({
          userId: user?.id || '',
          userEmail: user?.email || '',
          tableName: 'procurement_steps',
          recordId: created.id,
          action: 'create',
          newData: created as unknown as Record<string, unknown>,
        });
        setHighlightedId(created.id);
      }

      setIsModalOpen(false);
      refetch();
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : 'Operation failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: DbProcurementStep) => {
    const newStatus = item.status === 'published' ? 'draft' : 'published';
    try {
      await updateProcurementStepStatus(item.id, newStatus, user?.id || '');
      await logAuditEntry({
        userId: user?.id || '',
        userEmail: user?.email || '',
        tableName: 'procurement_steps',
        recordId: item.id,
        action: newStatus === 'published' ? 'publish' : 'unpublish',
        oldData: { status: item.status },
        newData: { status: newStatus },
      });
      refetch();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await deleteProcurementStep(deleteItem.id);
      await logAuditEntry({
        userId: user?.id || '',
        userEmail: user?.email || '',
        tableName: 'procurement_steps',
        recordId: deleteItem.id,
        action: 'delete',
        oldData: deleteItem as unknown as Record<string, unknown>,
      });
      setDeleteItem(null);
      refetch();
    } catch (err) {
      console.error('Failed to delete step:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleMoveStep = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= data.length) return;

    const reordered = [...data];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    const payload = reordered.map((item, idx) => ({
      id: item.id,
      display_order: idx + 1,
      step_number: idx + 1,
    }));

    try {
      await reorderProcurementSteps(payload, user?.id || '');
      refetch();
    } catch (err) {
      console.error('Failed to reorder steps:', err);
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Procurement Process Steps"
        description="Maintain the sequential steps of the procurement workflow from identification to delivery."
      />

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[var(--text-primary)]">All Process Steps</h2>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary-blue)] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[var(--dark-blue)] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Process Step
        </button>
      </div>

      {/* Reorder Helper & Main Table */}
      {loading ? (
        <LoadingSpinner message="Loading procurement steps..." />
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          Error: {error}
        </div>
      ) : data.length === 0 ? (
        <EmptyAdminState
          title="No Procurement Steps"
          message="No process steps exist in the database yet. Click below to add the first step."
          actionLabel="Add Step"
          onAction={handleOpenCreateModal}
        />
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={data}
            onEdit={handleOpenEditModal}
            onDelete={(item) => setDeleteItem(item)}
            onToggleStatus={handleToggleStatus}
            searchPlaceholder="Search step title, description, responsible party..."
            highlightedId={highlightedId}
          />

          {/* Quick Step Order Controls */}
          <div className="rounded-xl border border-[var(--border-grey)] bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Step Ordering Quick Controls</h3>
            <div className="divide-y divide-gray-100">
              {data.map((step, idx) => (
                <div key={step.id} className="flex items-center justify-between py-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[var(--primary-blue)]">#{step.step_number}</span>
                    <span className="font-medium text-[var(--text-primary)]">{step.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveStep(idx, 'up')}
                      className="rounded border border-gray-200 px-2 py-0.5 font-bold hover:bg-gray-100 disabled:opacity-30"
                      title="Move step up"
                    >
                      ↑ Up
                    </button>
                    <button
                      type="button"
                      disabled={idx === data.length - 1}
                      onClick={() => handleMoveStep(idx, 'down')}
                      className="rounded border border-gray-200 px-2 py-0.5 font-bold hover:bg-gray-100 disabled:opacity-30"
                      title="Move step down"
                    >
                      ↓ Down
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Procurement Step' : 'Add New Procurement Step'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formErrors.submit && (
            <div className="rounded-md bg-red-50 p-3 text-xs font-semibold text-red-700">
              {formErrors.submit}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)]">Step Number *</label>
              <input
                type="number"
                min={1}
                required
                value={formData.step_number}
                onChange={(e) => setFormData({ ...formData, step_number: parseInt(e.target.value) || 1 })}
                className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none"
              />
              {formErrors.step_number && <p className="mt-1 text-[11px] text-red-600">{formErrors.step_number}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)]">Step Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Identify the Requirement"
                className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none"
              />
              {formErrors.title && <p className="mt-1 text-[11px] text-red-600">{formErrors.title}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)]">Description *</label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. The requester identifies the goods or services required and defines the business need."
              className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none"
            />
            {formErrors.description && <p className="mt-1 text-[11px] text-red-600">{formErrors.description}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)]">Responsible Party</label>
              <input
                type="text"
                value={formData.responsible_party}
                onChange={(e) => setFormData({ ...formData, responsible_party: e.target.value })}
                placeholder="e.g. Requester / Supply Chain"
                className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)]">Expected Duration</label>
              <input
                type="text"
                value={formData.expected_duration}
                onChange={(e) => setFormData({ ...formData, expected_duration: e.target.value })}
                placeholder="e.g. 1–3 working days"
                className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)]">Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes for this step"
              className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)]">Publishing Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'published' | 'draft' })}
                className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none bg-white"
              >
                <option value="draft">Draft (Hidden from public site)</option>
                <option value="published">Published (Visible on public site)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)]">Display Order</label>
              <input
                type="number"
                min={0}
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-grey)]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-md border border-[var(--border-grey)] bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--light-grey)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-[var(--primary-blue)] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[var(--dark-blue)] disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingItem ? 'Update Step' : 'Create Step'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Procurement Step"
        message={`Are you sure you want to delete Step ${deleteItem?.step_number}: "${deleteItem?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Step"
        loading={deleting}
      />
    </div>
  );
}
