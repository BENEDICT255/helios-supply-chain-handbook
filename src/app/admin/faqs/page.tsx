'use client';

import React, { useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import DataTable, { Column } from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import EmptyAdminState from '@/components/admin/EmptyAdminState';
import { useFaqs } from '@/hooks/useFaqs';
import { useAuth } from '@/hooks/useAuth';
import {
  createFaq,
  updateFaq,
  deleteFaq,
  updateFaqStatus,
} from '@/services/faqs';
import { logAuditEntry } from '@/services/auditLog';
import type { DbFaq } from '@/types/database';
import { faqSchema, FaqFormData } from '@/lib/validations/faqs';

export default function AdminFaqsPage() {
  const { data, loading, error, refetch } = useFaqs();
  const { user } = useAuth();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DbFaq | null>(null);

  // Form State
  const [formData, setFormData] = useState<FaqFormData>({
    question: '',
    answer: '',
    category: 'Requests',
    status: 'draft',
    display_order: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteItem, setDeleteItem] = useState<DbFaq | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Table Columns
  const columns: Column<DbFaq>[] = [
    {
      key: 'question',
      header: 'Question',
      accessor: (item) => <span className="font-bold text-[var(--text-primary)]">{item.question}</span>,
      sortable: true,
      searchable: true,
    },
    {
      key: 'category',
      header: 'Category',
      accessor: (item) => (
        <span className="inline-block rounded-md bg-[var(--pale-blue)] px-2.5 py-1 text-xs font-semibold text-[var(--primary-blue)]">
          {item.category}
        </span>
      ),
      sortable: true,
      searchable: true,
    },
    {
      key: 'answer',
      header: 'Answer Snippet',
      accessor: (item) => (
        <span className="text-gray-600 text-xs line-clamp-2">{item.answer}</span>
      ),
      sortable: false,
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
      question: '',
      answer: '',
      category: 'Requests',
      status: 'draft',
      display_order: data.length + 1,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: DbFaq) => {
    setEditingItem(item);
    setFormData({
      question: item.question,
      answer: item.answer,
      category: item.category,
      status: item.status,
      display_order: item.display_order,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const result = faqSchema.safeParse(formData);
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
        const updated = await updateFaq(editingItem.id, result.data, user?.id || '');
        await logAuditEntry({
          userId: user?.id || '',
          userEmail: user?.email || '',
          tableName: 'faqs',
          recordId: editingItem.id,
          action: 'update',
          oldData: editingItem as unknown as Record<string, unknown>,
          newData: updated as unknown as Record<string, unknown>,
        });
      } else {
        const created = await createFaq(result.data, user?.id || '');
        await logAuditEntry({
          userId: user?.id || '',
          userEmail: user?.email || '',
          tableName: 'faqs',
          recordId: created.id,
          action: 'create',
          newData: created as unknown as Record<string, unknown>,
        });
      }

      setIsModalOpen(false);
      refetch();
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : 'Operation failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: DbFaq) => {
    const newStatus = item.status === 'published' ? 'draft' : 'published';
    try {
      await updateFaqStatus(item.id, newStatus, user?.id || '');
      await logAuditEntry({
        userId: user?.id || '',
        userEmail: user?.email || '',
        tableName: 'faqs',
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
      await deleteFaq(deleteItem.id);
      await logAuditEntry({
        userId: user?.id || '',
        userEmail: user?.email || '',
        tableName: 'faqs',
        recordId: deleteItem.id,
        action: 'delete',
        oldData: deleteItem as unknown as Record<string, unknown>,
      });
      setDeleteItem(null);
      refetch();
    } catch (err) {
      console.error('Failed to delete FAQ:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Frequently Asked Questions"
        description="Manage questions, detailed answers, and category organization for employees."
      />

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[var(--text-primary)]">All FAQ Entries</h2>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary-blue)] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[var(--dark-blue)] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New FAQ
        </button>
      </div>

      {/* Main Table View */}
      {loading ? (
        <LoadingSpinner message="Loading FAQs..." />
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          Error: {error}
        </div>
      ) : data.length === 0 ? (
        <EmptyAdminState
          title="No FAQs Available"
          message="No FAQ entries exist in the database yet. Click below to add your first question."
          actionLabel="Add FAQ"
          onAction={handleOpenCreateModal}
        />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          onEdit={handleOpenEditModal}
          onDelete={(item) => setDeleteItem(item)}
          onToggleStatus={handleToggleStatus}
          searchPlaceholder="Search question, answer, category..."
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit FAQ Entry' : 'Add New FAQ Entry'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formErrors.submit && (
            <div className="rounded-md bg-red-50 p-3 text-xs font-semibold text-red-700">
              {formErrors.submit}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)]">Category *</label>
            <input
              type="text"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g. Requests, Timelines, Process, Sourcing, Suppliers, Support"
              className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none"
            />
            {formErrors.category && <p className="mt-1 text-[11px] text-red-600">{formErrors.category}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)]">Question *</label>
            <input
              type="text"
              required
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="e.g. How do I request goods or services?"
              className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none"
            />
            {formErrors.question && <p className="mt-1 text-[11px] text-red-600">{formErrors.question}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)]">Answer *</label>
            <textarea
              rows={4}
              required
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              placeholder="Provide a clear, detailed answer for employees..."
              className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none"
            />
            {formErrors.answer && <p className="mt-1 text-[11px] text-red-600">{formErrors.answer}</p>}
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
              {submitting ? 'Saving...' : editingItem ? 'Update FAQ' : 'Create FAQ'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete FAQ Entry"
        message={`Are you sure you want to delete "${deleteItem?.question}"? This action cannot be undone.`}
        confirmLabel="Delete FAQ"
        loading={deleting}
      />
    </div>
  );
}
