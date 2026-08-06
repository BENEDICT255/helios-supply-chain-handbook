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
import { useDeliveryTimelines } from '@/hooks/useDeliveryTimelines';
import { useAuth } from '@/hooks/useAuth';
import {
  createDeliveryTimeline,
  updateDeliveryTimeline,
  deleteDeliveryTimeline,
  updateDeliveryTimelineStatus,
} from '@/services/deliveryTimelines';
import { logAuditEntry } from '@/services/auditLog';
import type { DbDeliveryTimeline } from '@/types/database';
import { deliveryTimelineSchema, DeliveryTimelineFormData } from '@/lib/validations/delivery';

export default function AdminDeliveryTimelinesPage() {
  const { data, loading, error, refetch } = useDeliveryTimelines();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const paramHighlight = searchParams.get('highlight');

  // Highlight State for newly inserted records
  const [highlightedId, setHighlightedId] = useState<string | null>(paramHighlight);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DbDeliveryTimeline | null>(null);

  // Form State
  const [formData, setFormData] = useState<DeliveryTimelineFormData>({
    department: 'Information Technology',
    category: '',
    item: '',
    estimated_lead_time: '',
    requirements: '',
    notes: '',
    status: 'draft',
    display_order: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteItem, setDeleteItem] = useState<DbDeliveryTimeline | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Table Columns Setup
  const columns: Column<DbDeliveryTimeline>[] = [
    {
      key: 'item',
      header: 'Item Name',
      accessor: (item) => <span className="font-bold text-[var(--text-primary)]">{item.item}</span>,
      sortable: true,
      searchable: true,
    },
    {
      key: 'department',
      header: 'Department',
      accessor: (item) => <span className="text-gray-700">{item.department}</span>,
      sortable: true,
      searchable: true,
    },
    {
      key: 'category',
      header: 'Category',
      accessor: (item) => <span className="text-gray-600">{item.category}</span>,
      sortable: true,
      searchable: true,
    },
    {
      key: 'estimated_lead_time',
      header: 'Lead Time',
      accessor: (item) => <span className="font-medium text-[var(--primary-blue)]">{item.estimated_lead_time}</span>,
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
    setFormData({
      department: 'Information Technology',
      category: '',
      item: '',
      estimated_lead_time: '',
      requirements: '',
      notes: '',
      status: 'draft',
      display_order: data.length + 1,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: DbDeliveryTimeline) => {
    setEditingItem(item);
    setFormData({
      department: item.department,
      category: item.category,
      item: item.item,
      estimated_lead_time: item.estimated_lead_time,
      requirements: item.requirements || '',
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

    const result = deliveryTimelineSchema.safeParse(formData);
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
        // Update
        const updated = await updateDeliveryTimeline(editingItem.id, result.data, user?.id || '');
        await logAuditEntry({
          userId: user?.id || '',
          userEmail: user?.email || '',
          tableName: 'delivery_timelines',
          recordId: editingItem.id,
          action: 'update',
          oldData: editingItem as unknown as Record<string, unknown>,
          newData: updated as unknown as Record<string, unknown>,
        });
      } else {
        // Create
        const created = await createDeliveryTimeline(result.data, user?.id || '');
        await logAuditEntry({
          userId: user?.id || '',
          userEmail: user?.email || '',
          tableName: 'delivery_timelines',
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

  const handleToggleStatus = async (item: DbDeliveryTimeline) => {
    const newStatus = item.status === 'published' ? 'draft' : 'published';
    try {
      await updateDeliveryTimelineStatus(item.id, newStatus, user?.id || '');
      await logAuditEntry({
        userId: user?.id || '',
        userEmail: user?.email || '',
        tableName: 'delivery_timelines',
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
      await deleteDeliveryTimeline(deleteItem.id);
      await logAuditEntry({
        userId: user?.id || '',
        userEmail: user?.email || '',
        tableName: 'delivery_timelines',
        recordId: deleteItem.id,
        action: 'delete',
        oldData: deleteItem as unknown as Record<string, unknown>,
      });
      setDeleteItem(null);
      refetch();
    } catch (err) {
      console.error('Failed to delete item:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Delivery Timelines"
        description="Maintain indicative lead times for goods, services, and categories across departments."
      />

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[var(--text-primary)]">All Timeline Records</h2>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary-blue)] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[var(--dark-blue)] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New Timeline
        </button>
      </div>

      {/* Main Table View */}
      {loading ? (
        <LoadingSpinner message="Loading delivery timelines..." />
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          Error: {error}
        </div>
      ) : data.length === 0 ? (
        <EmptyAdminState
          title="No Delivery Timelines"
          message="No timeline records exist in the database yet. Click below to add your first record."
          actionLabel="Add Timeline"
          onAction={handleOpenCreateModal}
        />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          onEdit={handleOpenEditModal}
          onDelete={(item) => setDeleteItem(item)}
          onToggleStatus={handleToggleStatus}
          searchPlaceholder="Search item, category, department..."
          highlightedId={highlightedId}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Delivery Timeline' : 'Add New Delivery Timeline'}
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
              <label className="block text-xs font-semibold text-[var(--text-primary)]">Department *</label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Information Technology"
                className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none"
              />
              {formErrors.department && <p className="mt-1 text-[11px] text-red-600">{formErrors.department}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)]">Category *</label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Computers and Accessories"
                className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none"
              />
              {formErrors.category && <p className="mt-1 text-[11px] text-red-600">{formErrors.category}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)]">Item Name *</label>
              <input
                type="text"
                required
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                placeholder="e.g. Laptop"
                className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none"
              />
              {formErrors.item && <p className="mt-1 text-[11px] text-red-600">{formErrors.item}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)]">Estimated Lead Time *</label>
              <input
                type="text"
                required
                value={formData.estimated_lead_time}
                onChange={(e) => setFormData({ ...formData, estimated_lead_time: e.target.value })}
                placeholder="e.g. 4–6 weeks"
                className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none"
              />
              {formErrors.estimated_lead_time && <p className="mt-1 text-[11px] text-red-600">{formErrors.estimated_lead_time}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)]">Requirements</label>
            <textarea
              rows={2}
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              placeholder="e.g. Approved specification, approved budget and completed request"
              className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)]">Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Subject to supplier stock and model availability"
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
              {submitting ? 'Saving...' : editingItem ? 'Update Record' : 'Create Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Delivery Timeline"
        message={`Are you sure you want to delete "${deleteItem?.item}"? This action cannot be undone.`}
        confirmLabel="Delete Record"
        loading={deleting}
      />
    </div>
  );
}
