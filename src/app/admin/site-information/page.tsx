'use client';

import React, { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import { useSiteInfo } from '@/hooks/useSiteInfo';
import { useAuth } from '@/hooks/useAuth';
import { updateSiteInformation } from '@/services/siteInfo';
import { logAuditEntry } from '@/services/auditLog';
import { siteInfoSchema, SiteInfoFormData } from '@/lib/validations/site-info';

export default function AdminSiteInformationPage() {
  const { data: siteInfo, loading, error, refetch } = useSiteInfo();
  const { user } = useAuth();

  const [formData, setFormData] = useState<SiteInfoFormData>({
    version: '1.0',
    last_updated: 'August 2026',
    contact_email: 'supplychain@example.com',
    office: 'Supply Chain Department',
    working_hours: 'Monday to Friday, 08:00–17:00',
    homepage_notice: '',
    support_message: 'If you cannot find the answer to your question, please contact the Supply Chain team directly.',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    if (siteInfo && !ignore) {
      setTimeout(() => {
        setFormData({
          version: siteInfo.version || '1.0',
          last_updated: siteInfo.last_updated || '',
          contact_email: siteInfo.contact_email || '',
          office: siteInfo.office || '',
          working_hours: siteInfo.working_hours || '',
          homepage_notice: siteInfo.homepage_notice || '',
          support_message: siteInfo.support_message || '',
        });
      }, 0);
    }
    return () => {
      ignore = true;
    };
  }, [siteInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setSuccessMessage(null);

    const result = siteInfoSchema.safeParse(formData);
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
      const updated = await updateSiteInformation(result.data, user?.id || '');
      await logAuditEntry({
        userId: user?.id || '',
        userEmail: user?.email || '',
        tableName: 'site_information',
        recordId: '1',
        action: 'update',
        oldData: siteInfo as unknown as Record<string, unknown>,
        newData: updated as unknown as Record<string, unknown>,
      });

      setSuccessMessage('Site information updated successfully!');
      refetch();
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : 'Update failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <AdminHeader
        title="Site Information Settings"
        description="Maintain global handbook metadata, contact details, working hours, and site notices."
      />

      {loading ? (
        <LoadingSpinner message="Loading site settings..." />
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          Error: {error}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border-grey)] bg-white p-6 shadow-xs space-y-6">
          {successMessage && (
            <div className="rounded-md bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200">
              ✓ {successMessage}
            </div>
          )}

          {formErrors.submit && (
            <div className="rounded-md bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
              {formErrors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Version & Date */}
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-gray-100 pb-2 mb-4">
                Handbook Metadata
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)]">Version Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="e.g. 1.0"
                    className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none"
                  />
                  {formErrors.version && <p className="mt-1 text-[11px] text-red-600">{formErrors.version}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)]">Last Updated Date *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_updated}
                    onChange={(e) => setFormData({ ...formData, last_updated: e.target.value })}
                    placeholder="e.g. August 2026"
                    className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none"
                  />
                  {formErrors.last_updated && <p className="mt-1 text-[11px] text-red-600">{formErrors.last_updated}</p>}
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-gray-100 pb-2 mb-4">
                Contact & Location Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)]">Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="supplychain@example.com"
                    className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none"
                  />
                  {formErrors.contact_email && <p className="mt-1 text-[11px] text-red-600">{formErrors.contact_email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)]">Office Department</label>
                  <input
                    type="text"
                    value={formData.office}
                    onChange={(e) => setFormData({ ...formData, office: e.target.value })}
                    placeholder="e.g. Supply Chain Department"
                    className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)]">Working Hours</label>
                  <input
                    type="text"
                    value={formData.working_hours}
                    onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                    placeholder="e.g. Monday to Friday, 08:00–17:00"
                    className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Public Announcements & Messages */}
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-gray-100 pb-2 mb-4">
                Public Messages & Notices
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)]">Homepage Announcement Notice</label>
                  <input
                    type="text"
                    value={formData.homepage_notice}
                    onChange={(e) => setFormData({ ...formData, homepage_notice: e.target.value })}
                    placeholder="Optional banner message for the homepage (leave blank if none)"
                    className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)]">Support Section Callout Message</label>
                  <textarea
                    rows={2}
                    value={formData.support_message}
                    onChange={(e) => setFormData({ ...formData, support_message: e.target.value })}
                    placeholder="Displayed in the support callout box on the homepage and FAQ page"
                    className="mt-1 w-full rounded-md border border-[var(--border-grey)] px-3 py-2 text-xs sm:text-sm focus:border-[var(--primary-blue)] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-[var(--primary-blue)] px-5 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[var(--dark-blue)] transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving Settings...' : 'Save Site Information'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
