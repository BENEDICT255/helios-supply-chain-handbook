'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import type { ValidationSummary } from '@/services/excelParser';
import type { WorkbookDiffSummary } from '@/services/excelDiff';

export default function ExcelUploadWizardPage() {

  // Wizard Step: 1 = File Select, 2 = Validation Results, 3 = Change Preview, 4 = Applied Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Uploaded Batch Data
  const [batchId, setBatchId] = useState<string | null>(null);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [diffSummary, setDiffSummary] = useState<WorkbookDiffSummary | null>(null);

  // Missing Row Choices (keyed by DB record ID)
  const [missingRowChoices, setMissingRowChoices] = useState<Record<string, 'keep' | 'unpublish' | 'delete'>>({});

  // Publishing & Executing State
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith('.xlsx')) {
        setUploadError('Only .xlsx files are allowed.');
        setFile(null);
        return;
      }
      if (selected.size > 5 * 1024 * 1024) {
        setUploadError('File exceeds maximum size limit of 5 MB.');
        setFile(null);
        return;
      }
      setUploadError(null);
      setFile(selected);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/excel/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setBatchId(data.batchId);
      setValidationSummary(data.validationSummary);
      setDiffSummary(data.diffSummary);
      setStep(2);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload workbook');
    } finally {
      setUploading(false);
    }
  };

  const handleApplyImport = async () => {
    if (!batchId || !diffSummary) return;

    // Apply missing row choices to diffSummary
    const updatedDelivery = diffSummary.deliveryTimelines.map((item) => {
      if (item.type === 'missing' && item.dbRecord) {
        return { ...item, userChoice: missingRowChoices[item.dbRecord.id] || 'keep' };
      }
      return item;
    });

    const updatedProcurement = diffSummary.procurementSteps.map((step) => {
      if (step.type === 'missing' && step.dbRecord) {
        return { ...step, userChoice: missingRowChoices[step.dbRecord.id] || 'keep' };
      }
      return step;
    });

    const finalDiffSummary: WorkbookDiffSummary = {
      ...diffSummary,
      deliveryTimelines: updatedDelivery,
      procurementSteps: updatedProcurement,
    };

    setImporting(true);
    try {
      const res = await fetch('/api/admin/excel/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          diffSummary: finalDiffSummary,
          publishImmediately,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      setStep(4);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <AdminHeader
        title="Excel Upload Wizard"
        description="Upload a bulk workbook, review validation rules, preview proposed changes, and apply to database."
      />

      {/* Progress Steps Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-grey)] bg-white px-6 py-4 rounded-xl shadow-xs text-xs font-semibold">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[var(--primary-blue)] font-bold' : 'text-gray-400'}`}>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--pale-blue)]">1</span>
          Select Workbook
        </div>
        <div className="text-gray-300">→</div>
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[var(--primary-blue)] font-bold' : 'text-gray-400'}`}>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--pale-blue)]">2</span>
          Validation Results
        </div>
        <div className="text-gray-300">→</div>
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[var(--primary-blue)] font-bold' : 'text-gray-400'}`}>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--pale-blue)]">3</span>
          Change Preview
        </div>
        <div className="text-gray-300">→</div>
        <div className={`flex items-center gap-2 ${step >= 4 ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">4</span>
          Confirmation
        </div>
      </div>

      {/* ----------------------------------------------------
          STEP 1: SELECT WORKBOOK FILE
         ---------------------------------------------------- */}
      {step === 1 && (
        <div className="rounded-xl border border-[var(--border-grey)] bg-white p-8 shadow-xs space-y-6">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-[var(--text-primary)]">Upload Excel Workbook</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Select a completed <code className="font-mono text-blue-800 bg-blue-50 px-1 py-0.5 rounded">.xlsx</code> workbook.
              The database remains the source of truth — changes will be previewed before applying.
            </p>
          </div>

          {uploadError && (
            <div className="rounded-md bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-200">
              {uploadError}
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-6">
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border-grey)] bg-[var(--light-grey)] p-10 text-center hover:border-[var(--primary-blue)] transition-colors">
              <svg className="h-10 w-10 text-[var(--primary-blue)] mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
              </svg>
              <label htmlFor="file-upload" className="cursor-pointer font-bold text-xs sm:text-sm text-[var(--primary-blue)] hover:underline">
                Choose Excel file (.xlsx)
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="sr-only"
              />
              <p className="mt-1 text-xs text-[var(--text-muted)]">Maximum file size: 5 MB</p>
              {file && (
                <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 border border-emerald-200">
                  ✓ Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <Link
                href="/admin"
                className="rounded-md border border-[var(--border-grey)] bg-white px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--light-grey)]"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={!file || uploading}
                className="rounded-md bg-[var(--primary-blue)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--dark-blue)] disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Validating Workbook...' : 'Upload & Validate →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ----------------------------------------------------
          STEP 2: VALIDATION RESULTS
         ---------------------------------------------------- */}
      {step === 2 && validationSummary && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--border-grey)] bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">Validation Results</h2>
                <p className="text-xs text-[var(--text-muted)]">Workbook: {validationSummary.fileName}</p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                  validationSummary.hasBlockingErrors
                    ? 'bg-red-100 text-red-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {validationSummary.hasBlockingErrors ? 'Blocking Errors Found' : 'Validation Passed'}
              </span>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-4 sm:grid-cols-4 text-center text-xs">
              <div className="rounded-lg bg-gray-50 p-3 border border-gray-200">
                <span className="block text-[var(--text-muted)]">Delivery Rows</span>
                <span className="text-lg font-extrabold text-[var(--text-primary)]">
                  {validationSummary.validDeliveryRows} / {validationSummary.totalDeliveryRows}
                </span>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 border border-gray-200">
                <span className="block text-[var(--text-muted)]">Procurement Rows</span>
                <span className="text-lg font-extrabold text-[var(--text-primary)]">
                  {validationSummary.validProcurementRows} / {validationSummary.totalProcurementRows}
                </span>
              </div>
              <div className="rounded-lg bg-red-50 p-3 border border-red-200 text-red-800">
                <span className="block">Blocking Errors</span>
                <span className="text-lg font-extrabold">{validationSummary.errors.length}</span>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 text-amber-800">
                <span className="block">Warnings</span>
                <span className="text-lg font-extrabold">{validationSummary.warnings.length}</span>
              </div>
            </div>

            {/* Errors Table */}
            {validationSummary.errors.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-700">Blocking Error Log</h3>
                <div className="max-h-60 overflow-y-auto rounded-lg border border-red-200 bg-red-50/50 p-3">
                  <ul className="space-y-1.5 text-xs text-red-800 font-mono">
                    {validationSummary.errors.map((err, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="font-bold">[{err.sheet} Row {err.row}]</span>
                        <span>{err.column}: {err.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[var(--border-grey)]">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-md border border-[var(--border-grey)] bg-white px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--light-grey)]"
            >
              ← Re-upload File
            </button>

            <button
              type="button"
              disabled={validationSummary.hasBlockingErrors}
              onClick={() => setStep(3)}
              className="rounded-md bg-[var(--primary-blue)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--dark-blue)] disabled:opacity-50 transition-colors"
            >
              Proceed to Change Preview →
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          STEP 3: CHANGE PREVIEW
         ---------------------------------------------------- */}
      {step === 3 && diffSummary && (
        <div className="space-y-6">
          {/* Summary Pills */}
          <div className="grid gap-4 sm:grid-cols-4 text-center text-xs">
            <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-emerald-900 font-bold">
              <span>Inserts: +{diffSummary.proposedInserts}</span>
            </div>
            <div className="rounded-xl bg-blue-50 p-4 border border-blue-200 text-blue-900 font-bold">
              <span>Updates: ~{diffSummary.proposedUpdates}</span>
            </div>
            <div className="rounded-xl bg-amber-50 p-4 border border-amber-200 text-amber-900 font-bold">
              <span>Unpublishes: {diffSummary.proposedUnpublishes}</span>
            </div>
            <div className="rounded-xl bg-red-50 p-4 border border-red-200 text-red-900 font-bold">
              <span>Deletes: -{diffSummary.proposedDeletes}</span>
            </div>
          </div>

          {/* Delivery Timelines Diff List */}
          <div className="rounded-xl border border-[var(--border-grey)] bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-gray-100 pb-2">
              Delivery Timelines Proposed Changes ({diffSummary.deliveryTimelines.length})
            </h3>
            <div className="space-y-3 max-h-72 overflow-y-auto text-xs">
              {diffSummary.deliveryTimelines.map((item, idx) => (
                <div key={idx} className="rounded-lg border border-gray-200 p-3 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>
                      {item.type === 'insert' && `[+ NEW] ${item.parsedRow?.item}`}
                      {item.type === 'update' && `[~ UPDATE] ${item.parsedRow?.item}`}
                      {item.type === 'unchanged' && `[UNCHANGED] ${item.parsedRow?.item}`}
                      {item.type === 'missing' && `[MISSING ROW] ${item.dbRecord?.item}`}
                    </span>
                    <span className="uppercase text-[10px] text-gray-500">{item.type}</span>
                  </div>

                  {item.diffs.length > 0 && (
                    <ul className="pl-4 text-gray-600 list-disc space-y-0.5">
                      {item.diffs.map((d, i) => (
                        <li key={i}>
                          <span className="font-semibold">{d.fieldLabel}:</span>{' '}
                          <span className="line-through text-red-600 mr-1">{String(d.oldValue)}</span>
                          <span className="text-emerald-700 font-bold">→ {String(d.newValue)}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {item.type === 'missing' && item.dbRecord && (
                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-gray-500 font-medium">Record missing from workbook:</span>
                      <select
                        value={missingRowChoices[item.dbRecord.id] || 'keep'}
                        onChange={(e) =>
                          setMissingRowChoices({
                            ...missingRowChoices,
                            [item.dbRecord!.id]: e.target.value as 'keep' | 'unpublish' | 'delete',
                          })
                        }
                        className="rounded border border-gray-300 px-2 py-1 bg-white text-xs"
                      >
                        <option value="keep">Keep Unchanged (Recommended)</option>
                        <option value="unpublish">Unpublish (Set to Draft)</option>
                        <option value="delete">Delete Record</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Procurement Process Diff List */}
          <div className="rounded-xl border border-[var(--border-grey)] bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-gray-100 pb-2">
              Procurement Process Proposed Changes ({diffSummary.procurementSteps.length})
            </h3>
            <div className="space-y-3 max-h-72 overflow-y-auto text-xs">
              {diffSummary.procurementSteps.map((step, idx) => (
                <div key={idx} className="rounded-lg border border-gray-200 p-3 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>
                      {step.type === 'insert' && `[+ NEW] ${step.parsedRow?.title}`}
                      {step.type === 'update' && `[~ UPDATE] ${step.parsedRow?.title}`}
                      {step.type === 'unchanged' && `[UNCHANGED] ${step.parsedRow?.title}`}
                      {step.type === 'missing' && `[MISSING ROW] ${step.dbRecord?.title}`}
                    </span>
                    <span className="uppercase text-[10px] text-gray-500">{step.type}</span>
                  </div>

                  {step.diffs.length > 0 && (
                    <ul className="pl-4 text-gray-600 list-disc space-y-0.5">
                      {step.diffs.map((d, i) => (
                        <li key={i}>
                          <span className="font-semibold">{d.fieldLabel}:</span>{' '}
                          <span className="line-through text-red-600 mr-1">{String(d.oldValue)}</span>
                          <span className="text-emerald-700 font-bold">→ {String(d.newValue)}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {step.type === 'missing' && step.dbRecord && (
                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-gray-500 font-medium">Record missing from workbook:</span>
                      <select
                        value={missingRowChoices[step.dbRecord.id] || 'keep'}
                        onChange={(e) =>
                          setMissingRowChoices({
                            ...missingRowChoices,
                            [step.dbRecord!.id]: e.target.value as 'keep' | 'unpublish' | 'delete',
                          })
                        }
                        className="rounded border border-gray-300 px-2 py-1 bg-white text-xs"
                      >
                        <option value="keep">Keep Unchanged (Recommended)</option>
                        <option value="unpublish">Unpublish (Set to Draft)</option>
                        <option value="delete">Delete Record</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Options & Action Bar */}
          <div className="rounded-xl border border-[var(--border-grey)] bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Publishing Option</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={publishImmediately}
                onChange={(e) => setPublishImmediately(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[var(--primary-blue)] focus:ring-[var(--primary-blue)]"
              />
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                Publish immediately after import (Otherwise imported rows remain as Draft)
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[var(--border-grey)]">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-md border border-[var(--border-grey)] bg-white px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--light-grey)]"
            >
              ← Back to Validation
            </button>

            <button
              type="button"
              disabled={importing}
              onClick={handleApplyImport}
              className="rounded-md bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {importing ? 'Applying Import & Creating Backup...' : 'Confirm & Apply Import →'}
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          STEP 4: IMPORT APPLIED SUCCESS
         ---------------------------------------------------- */}
      {step === 4 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-8 shadow-xs text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-emerald-950">Import Successfully Applied!</h2>
            <p className="text-xs text-emerald-800 max-w-md mx-auto">
              The workbook edits have been saved to the database. A pre-import snapshot backup was created, and full audit logs were recorded.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link
              href="/admin/delivery-timelines"
              className="rounded-lg bg-[var(--primary-blue)] px-5 py-2.5 text-xs font-bold text-white hover:bg-[var(--dark-blue)] transition-colors"
            >
              View Delivery Timelines
            </Link>
            <Link
              href="/admin/import-history"
              className="rounded-lg border border-[var(--border-grey)] bg-white px-5 py-2.5 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--light-grey)] transition-colors"
            >
              View Import History & Rollback
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
