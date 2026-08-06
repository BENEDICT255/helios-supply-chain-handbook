'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import type { ValidationSummary, ParsedDeliveryTimelineRow, ParsedProcurementStepRow, ValidationErrorItem } from '@/services/excelParser';
import { computeWorkbookDiffs, type WorkbookDiffSummary } from '@/services/excelDiff';
import type { DbDeliveryTimeline, DbProcurementStep } from '@/types/database';

const APPROVED_DEPARTMENTS = [
  'Information Technology',
  'Administration',
  'Network Operations',
  'Fleet',
  'Health, Safety and Environment',
  'Professional Services',
];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function ExcelUploadWizardPage() {
  // Wizard Step: 1 = File Select, 2 = Validation Results, 3 = Change Preview, 4 = Applied Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Uploaded Batch & DB Snapshot Data
  const [batchId, setBatchId] = useState<string | null>(null);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [diffSummary, setDiffSummary] = useState<WorkbookDiffSummary | null>(null);
  const [dbDeliveryRows, setDbDeliveryRows] = useState<DbDeliveryTimeline[]>([]);
  const [dbProcurementRows, setDbProcurementRows] = useState<DbProcurementStep[]>([]);

  // Step 2 Browser Editing State (Choice 1: Edit in Excel, Choice 2: Edit in Browser)
  const [validationFixMode, setValidationFixMode] = useState<'choice' | 'excel' | 'browser'>('choice');
  const [editableDeliveryRows, setEditableDeliveryRows] = useState<ParsedDeliveryTimelineRow[]>([]);
  const [editableProcurementRows, setEditableProcurementRows] = useState<ParsedProcurementStepRow[]>([]);

  // Step 3 Filtering State
  const [previewFilter, setPreviewFilter] = useState<'all' | 'insert' | 'update' | 'missing'>('all');

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

  const handleRemoveAttachment = () => {
    setFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      
      if (data.validationSummary) {
        setBatchId(data.batchId);
        setValidationSummary(data.validationSummary);
        setDiffSummary(data.diffSummary);
        setEditableDeliveryRows(data.validationSummary.parsedDeliveryRows || []);
        setEditableProcurementRows(data.validationSummary.parsedProcurementRows || []);
        setDbDeliveryRows(data.dbDeliveryTimelines || []);
        setDbProcurementRows(data.dbProcurementSteps || []);
        setValidationFixMode(data.validationSummary.hasBlockingErrors ? 'choice' : 'browser');
        setStep(2);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Upload failed');
      }

      setBatchId(data.batchId);
      setValidationSummary(data.validationSummary);
      setDiffSummary(data.diffSummary);
      setEditableDeliveryRows(data.validationSummary.parsedDeliveryRows || []);
      setEditableProcurementRows(data.validationSummary.parsedProcurementRows || []);
      setDbDeliveryRows(data.dbDeliveryTimelines || []);
      setDbProcurementRows(data.dbProcurementSteps || []);
      setValidationFixMode(data.validationSummary.hasBlockingErrors ? 'choice' : 'browser');
      setStep(2);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload workbook');
    } finally {
      setUploading(false);
    }
  };

  // Re-validates browser edits & re-computes diffs locally
  const revalidateBrowserEdits = (
    deliveryRows: ParsedDeliveryTimelineRow[],
    procurementRows: ParsedProcurementStepRow[]
  ) => {
    const newErrors: ValidationErrorItem[] = [];
    const seenDeliveryIds = new Set<string>();
    const seenProcurementIds = new Set<string>();

    const updatedDelivery = deliveryRows.map((row, idx) => {
      const rowNum = idx + 2;
      let isValid = true;

      if (row.id) {
        if (!UUID_REGEX.test(row.id)) {
          newErrors.push({
            sheet: 'Delivery Timelines',
            row: rowNum,
            column: 'Record ID',
            message: `Invalid Record ID format "${row.id}". Record ID must be a valid UUID or left blank for new items.`,
            severity: 'error',
          });
          isValid = false;
        } else if (seenDeliveryIds.has(row.id)) {
          newErrors.push({
            sheet: 'Delivery Timelines',
            row: rowNum,
            column: 'Record ID',
            message: `Duplicate Record ID "${row.id}" found in sheet.`,
            severity: 'error',
          });
          isValid = false;
        } else {
          seenDeliveryIds.add(row.id);
        }
      }

      if (!row.department) {
        newErrors.push({ sheet: 'Delivery Timelines', row: rowNum, column: 'Department', message: 'Department is required.', severity: 'error' });
        isValid = false;
      } else if (!APPROVED_DEPARTMENTS.includes(row.department)) {
        newErrors.push({ sheet: 'Delivery Timelines', row: rowNum, column: 'Department', message: `Invalid department "${row.department}".`, severity: 'error' });
        isValid = false;
      }

      if (!row.category) {
        newErrors.push({ sheet: 'Delivery Timelines', row: rowNum, column: 'Category', message: 'Category is required.', severity: 'error' });
        isValid = false;
      }
      if (!row.item) {
        newErrors.push({ sheet: 'Delivery Timelines', row: rowNum, column: 'Item or Service', message: 'Item name is required.', severity: 'error' });
        isValid = false;
      }
      if (!row.estimatedLeadTime) {
        newErrors.push({ sheet: 'Delivery Timelines', row: rowNum, column: 'Estimated Lead Time', message: 'Estimated Lead Time is required.', severity: 'error' });
        isValid = false;
      }

      return { ...row, isValid };
    });

    const updatedProcurement = procurementRows.map((row, idx) => {
      const rowNum = idx + 2;
      let isValid = true;

      if (row.id) {
        if (!UUID_REGEX.test(row.id)) {
          newErrors.push({
            sheet: 'Procurement Process',
            row: rowNum,
            column: 'Record ID',
            message: `Invalid Record ID format "${row.id}". Record ID must be a valid UUID or left blank for new items.`,
            severity: 'error',
          });
          isValid = false;
        } else if (seenProcurementIds.has(row.id)) {
          newErrors.push({
            sheet: 'Procurement Process',
            row: rowNum,
            column: 'Record ID',
            message: `Duplicate Record ID "${row.id}" found in sheet.`,
            severity: 'error',
          });
          isValid = false;
        } else {
          seenProcurementIds.add(row.id);
        }
      }

      if (!row.title) {
        newErrors.push({ sheet: 'Procurement Process', row: rowNum, column: 'Title', message: 'Step title is required.', severity: 'error' });
        isValid = false;
      }
      if (!row.description) {
        newErrors.push({ sheet: 'Procurement Process', row: rowNum, column: 'Description', message: 'Description is required.', severity: 'error' });
        isValid = false;
      }

      return { ...row, isValid };
    });

    setEditableDeliveryRows(updatedDelivery);
    setEditableProcurementRows(updatedProcurement);

    // Compute updated validation summary
    const hasBlocking = newErrors.length > 0;
    if (validationSummary) {
      setValidationSummary({
        ...validationSummary,
        errors: newErrors,
        hasBlockingErrors: hasBlocking,
        parsedDeliveryRows: updatedDelivery,
        parsedProcurementRows: updatedProcurement,
        validDeliveryRows: updatedDelivery.filter((r) => r.isValid).length,
        validProcurementRows: updatedProcurement.filter((r) => r.isValid).length,
      });
    }

    // Recompute Diff Summary using updated valid rows
    const updatedDiff = computeWorkbookDiffs({
      parsedDeliveryRows: updatedDelivery.filter((r) => r.isValid),
      parsedProcurementRows: updatedProcurement.filter((r) => r.isValid),
      dbDeliveryTimelines: dbDeliveryRows,
      dbProcurementSteps: dbProcurementRows,
      missingRowChoices,
    });

    setDiffSummary(updatedDiff);
  };

  const handleAutoFixDuplicates = () => {
    const seenDelivery = new Set<string>();
    const seenProcurement = new Set<string>();

    const fixedDelivery = editableDeliveryRows.map((row) => {
      if (row.id) {
        if (seenDelivery.has(row.id)) {
          return { ...row, id: undefined }; // Clear duplicate ID so it becomes a new insert
        }
        seenDelivery.add(row.id);
      }
      return row;
    });

    const fixedProcurement = editableProcurementRows.map((row) => {
      if (row.id) {
        if (seenProcurement.has(row.id)) {
          return { ...row, id: undefined }; // Clear duplicate ID so it becomes a new insert
        }
        seenProcurement.add(row.id);
      }
      return row;
    });

    revalidateBrowserEdits(fixedDelivery, fixedProcurement);
  };

  const handleDeliveryCellChange = (index: number, field: keyof ParsedDeliveryTimelineRow, value: unknown) => {
    const updated = [...editableDeliveryRows];
    updated[index] = { ...updated[index], [field]: value };
    revalidateBrowserEdits(updated, editableProcurementRows);
  };

  const handleProcurementCellChange = (index: number, field: keyof ParsedProcurementStepRow, value: unknown) => {
    const updated = [...editableProcurementRows];
    updated[index] = { ...updated[index], [field]: value };
    revalidateBrowserEdits(editableDeliveryRows, updated);
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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
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
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="sr-only"
              />
              <p className="mt-1 text-xs text-[var(--text-muted)]">Maximum file size: 5 MB</p>

              {file && (
                <div className="mt-4 flex items-center gap-3 rounded-lg bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-2xs">
                  <span>✓ Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                  <button
                    type="button"
                    onClick={handleRemoveAttachment}
                    className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-1 text-[11px] font-bold text-red-700 hover:bg-red-200 transition-colors ml-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Remove Attachment
                  </button>
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
          STEP 2: VALIDATION RESULTS & CHOICE (EXCEL vs BROWSER)
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

            {/* TWO CHOICES PROMPT FOR USERS WHEN ERRORS ARE FOUND */}
            {validationSummary.hasBlockingErrors && (
              <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    How would you like to handle these validation errors?
                  </h3>
                  <p className="text-xs text-amber-800 mt-1">
                    You can either fix the errors directly here in your browser or make changes in your Excel file and re-upload.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Choice 1: Edit in Excel */}
                  <button
                    type="button"
                    onClick={() => setValidationFixMode('excel')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      validationFixMode === 'excel'
                        ? 'border-[var(--primary-blue)] bg-blue-50/60 ring-2 ring-[var(--primary-blue)]/20'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="p-2 rounded-lg bg-blue-100 text-[var(--primary-blue)] font-bold text-sm">
                        📊 Option 1
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Edit in Excel File</h4>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          Fix errors in your spreadsheet software and re-upload the updated <code className="font-mono bg-blue-50 px-1 py-0.5 rounded">.xlsx</code> file.
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Choice 2: Edit in Browser */}
                  <button
                    type="button"
                    onClick={() => setValidationFixMode('browser')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      validationFixMode === 'browser'
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-gray-200 bg-white hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-sm">
                        🌐 Option 2
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Edit in Browser (Recommended)</h4>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          Fix row errors, duplicate IDs, or missing fields directly in the browser table below without re-uploading.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Choice 1 View: Re-upload in Excel */}
            {validationFixMode === 'excel' && validationSummary.hasBlockingErrors && (
              <div className="space-y-3 bg-blue-50/40 p-4 rounded-lg border border-blue-200 text-xs">
                <h4 className="font-bold text-[var(--primary-blue)]">Re-upload Instructions</h4>
                <p className="text-gray-700">
                  Open your local Excel workbook, resolve the errors listed in the Blocking Error Log below, save the file, and click <strong>← Re-upload File</strong>.
                </p>
              </div>
            )}

            {/* Choice 2 View: Browser Inline Editor */}
            {validationFixMode === 'browser' && (
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                      <span>🌐 Browser Interactive Data Editor</span>
                      {validationSummary.hasBlockingErrors && (
                        <span className="bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                          {validationSummary.errors.length} error(s) remaining
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Edits here immediately update validation rules and change preview diffs.
                    </p>
                  </div>

                  {validationSummary.hasBlockingErrors && (
                    <button
                      type="button"
                      onClick={handleAutoFixDuplicates}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-200 transition-colors shadow-2xs"
                    >
                      <span>⚡ Auto-Fix Duplicate Record IDs</span>
                    </button>
                  )}
                </div>

                {/* Delivery Timelines Table Editor */}
                {editableDeliveryRows.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-700">Delivery Timelines ({editableDeliveryRows.length} rows)</h4>
                    <div className="max-h-72 overflow-x-auto overflow-y-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-100 text-gray-700 font-semibold sticky top-0">
                          <tr>
                            <th className="p-2">Row</th>
                            <th className="p-2">Record ID (Column A)</th>
                            <th className="p-2">Department</th>
                            <th className="p-2">Category</th>
                            <th className="p-2">Item Name</th>
                            <th className="p-2">Lead Time</th>
                            <th className="p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {editableDeliveryRows.map((row, idx) => (
                            <tr key={idx} className={!row.isValid ? 'bg-red-50/60' : 'hover:bg-gray-50'}>
                              <td className="p-2 font-mono text-[11px] text-gray-500">{row.rowIndex || idx + 2}</td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.id || ''}
                                  placeholder="Leave blank for new insert"
                                  onChange={(e) => handleDeliveryCellChange(idx, 'id', e.target.value || undefined)}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-[11px] font-mono focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  value={row.department}
                                  onChange={(e) => handleDeliveryCellChange(idx, 'department', e.target.value)}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-[11px] bg-white"
                                >
                                  {APPROVED_DEPARTMENTS.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.category}
                                  onChange={(e) => handleDeliveryCellChange(idx, 'category', e.target.value)}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-[11px]"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.item}
                                  onChange={(e) => handleDeliveryCellChange(idx, 'item', e.target.value)}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-[11px] font-semibold"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.estimatedLeadTime}
                                  onChange={(e) => handleDeliveryCellChange(idx, 'estimatedLeadTime', e.target.value)}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-[11px]"
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  value={row.status}
                                  onChange={(e) => handleDeliveryCellChange(idx, 'status', e.target.value as 'published' | 'draft')}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-[11px] bg-white font-semibold"
                                >
                                  <option value="published">published</option>
                                  <option value="draft">draft</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Procurement Process Table Editor */}
                {editableProcurementRows.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-gray-700">Procurement Process ({editableProcurementRows.length} rows)</h4>
                    <div className="max-h-72 overflow-x-auto overflow-y-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-100 text-gray-700 font-semibold sticky top-0">
                          <tr>
                            <th className="p-2">Row</th>
                            <th className="p-2">Record ID (Column A)</th>
                            <th className="p-2">Step #</th>
                            <th className="p-2">Title</th>
                            <th className="p-2">Description</th>
                            <th className="p-2">Responsible Party</th>
                            <th className="p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {editableProcurementRows.map((row, idx) => (
                            <tr key={idx} className={!row.isValid ? 'bg-red-50/60' : 'hover:bg-gray-50'}>
                              <td className="p-2 font-mono text-[11px] text-gray-500">{row.rowIndex || idx + 2}</td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.id || ''}
                                  placeholder="Leave blank for new insert"
                                  onChange={(e) => handleProcurementCellChange(idx, 'id', e.target.value || undefined)}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-[11px] font-mono focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="p-2 w-16">
                                <input
                                  type="number"
                                  value={row.stepNumber}
                                  onChange={(e) => handleProcurementCellChange(idx, 'stepNumber', parseInt(e.target.value) || 1)}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-[11px]"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.title}
                                  onChange={(e) => handleProcurementCellChange(idx, 'title', e.target.value)}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-[11px] font-semibold"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.description}
                                  onChange={(e) => handleProcurementCellChange(idx, 'description', e.target.value)}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-[11px]"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.responsibleParty}
                                  onChange={(e) => handleProcurementCellChange(idx, 'responsibleParty', e.target.value)}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-[11px]"
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  value={row.status}
                                  onChange={(e) => handleProcurementCellChange(idx, 'status', e.target.value as 'published' | 'draft')}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-[11px] bg-white font-semibold"
                                >
                                  <option value="published">published</option>
                                  <option value="draft">draft</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Errors Log */}
            {validationSummary.errors.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-700">Blocking Error Log</h3>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-red-200 bg-red-50/50 p-3">
                  <ul className="space-y-1 text-xs text-red-800 font-mono">
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
              className="rounded-md bg-[var(--primary-blue)] px-5 py-2 text-xs font-bold text-white hover:bg-[var(--dark-blue)] disabled:opacity-50 transition-colors shadow-2xs"
            >
              Proceed to Change Preview →
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          STEP 3: CHANGE PREVIEW & FILTER/SCROLL TO INSERTS
         ---------------------------------------------------- */}
      {step === 3 && diffSummary && (
        <div className="space-y-6">
          {/* Summary Metric Pills — CLICKING INSERTS CARD SCROLLS & FILTERS */}
          <div className="grid gap-4 sm:grid-cols-4 text-center text-xs">
            <button
              type="button"
              onClick={() => {
                setPreviewFilter('insert');
                scrollToSection('proposed-changes-section');
              }}
              className={`rounded-xl p-4 border text-left transition-all ${
                previewFilter === 'insert'
                  ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-500/20'
                  : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/70'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-emerald-950">
                <span>Inserts: +{diffSummary.proposedInserts}</span>
                <span className="text-[10px] bg-emerald-200 px-2 py-0.5 rounded uppercase">Click to view</span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-1">Click to navigate to inserted items</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setPreviewFilter('update');
                scrollToSection('proposed-changes-section');
              }}
              className={`rounded-xl p-4 border text-left transition-all ${
                previewFilter === 'update'
                  ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-500/20'
                  : 'bg-blue-50 border-blue-200 hover:bg-blue-100/70'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-blue-950">
                <span>Updates: ~{diffSummary.proposedUpdates}</span>
                <span className="text-[10px] bg-blue-200 px-2 py-0.5 rounded uppercase">Filter</span>
              </div>
              <p className="text-[11px] text-blue-800 mt-1">View items with field changes</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setPreviewFilter('missing');
                scrollToSection('proposed-changes-section');
              }}
              className={`rounded-xl p-4 border text-left transition-all ${
                previewFilter === 'missing'
                  ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-500/20'
                  : 'bg-amber-50 border-amber-200 hover:bg-amber-100/70'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-amber-950">
                <span>Missing: {diffSummary.deliveryTimelines.filter(d=>d.type==='missing').length + diffSummary.procurementSteps.filter(s=>s.type==='missing').length}</span>
                <span className="text-[10px] bg-amber-200 px-2 py-0.5 rounded uppercase">Filter</span>
              </div>
              <p className="text-[11px] text-amber-800 mt-1">View records missing from workbook</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setPreviewFilter('all');
                scrollToSection('proposed-changes-section');
              }}
              className={`rounded-xl p-4 border text-left transition-all ${
                previewFilter === 'all'
                  ? 'bg-gray-200 border-gray-400 ring-2 ring-gray-400/20'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-gray-900">
                <span>All Changes</span>
                <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded uppercase">Show All</span>
              </div>
              <p className="text-[11px] text-gray-600 mt-1">Show complete diff view</p>
            </button>
          </div>

          <div id="proposed-changes-section" className="space-y-6 pt-2">
            {/* Filter Pills Header */}
            <div className="flex items-center justify-between bg-white px-4 py-2 rounded-lg border border-[var(--border-grey)] text-xs">
              <span className="font-bold text-[var(--text-primary)]">
                Active Filter: <span className="uppercase text-[var(--primary-blue)]">{previewFilter}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewFilter('all')}
                  className={`px-3 py-1 rounded text-[11px] font-semibold ${previewFilter === 'all' ? 'bg-[var(--primary-blue)] text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilter('insert')}
                  className={`px-3 py-1 rounded text-[11px] font-semibold ${previewFilter === 'insert' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}
                >
                  Inserts (+{diffSummary.proposedInserts})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilter('update')}
                  className={`px-3 py-1 rounded text-[11px] font-semibold ${previewFilter === 'update' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'}`}
                >
                  Updates (~{diffSummary.proposedUpdates})
                </button>
              </div>
            </div>

            {/* Delivery Timelines Diff List */}
            <div className="rounded-xl border border-[var(--border-grey)] bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-gray-100 pb-2">
                Delivery Timelines Proposed Changes ({diffSummary.deliveryTimelines.filter((i) => previewFilter === 'all' || i.type === previewFilter).length})
              </h3>
              <div className="space-y-3 max-h-72 overflow-y-auto text-xs">
                {diffSummary.deliveryTimelines
                  .filter((item) => previewFilter === 'all' || item.type === previewFilter)
                  .map((item, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 space-y-1 transition-all ${
                        item.type === 'insert'
                          ? 'border-emerald-300 bg-emerald-50/40'
                          : item.type === 'update'
                          ? 'border-blue-200 bg-blue-50/20'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className={item.type === 'insert' ? 'text-emerald-900 font-extrabold' : ''}>
                          {item.type === 'insert' && `[+ NEW INSERT] ${item.parsedRow?.item}`}
                          {item.type === 'update' && `[~ UPDATE] ${item.parsedRow?.item}`}
                          {item.type === 'unchanged' && `[UNCHANGED] ${item.parsedRow?.item}`}
                          {item.type === 'missing' && `[MISSING ROW] ${item.dbRecord?.item}`}
                        </span>
                        <span className={`uppercase text-[10px] px-2 py-0.5 rounded font-bold ${
                          item.type === 'insert' ? 'bg-emerald-200 text-emerald-900' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {item.type}
                        </span>
                      </div>

                      {item.diffs.length > 0 && (
                        <ul className="pl-4 text-gray-600 list-disc space-y-0.5">
                          {item.diffs.map((d, i) => (
                            <li key={i}>
                              <span className="font-semibold">{d.fieldLabel}:</span>{' '}
                              {d.oldValue && <span className="line-through text-red-600 mr-1">{String(d.oldValue)}</span>}
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
                Procurement Process Proposed Changes ({diffSummary.procurementSteps.filter((s) => previewFilter === 'all' || s.type === previewFilter).length})
              </h3>
              <div className="space-y-3 max-h-72 overflow-y-auto text-xs">
                {diffSummary.procurementSteps
                  .filter((step) => previewFilter === 'all' || step.type === previewFilter)
                  .map((step, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 space-y-1 transition-all ${
                        step.type === 'insert'
                          ? 'border-emerald-300 bg-emerald-50/40'
                          : step.type === 'update'
                          ? 'border-blue-200 bg-blue-50/20'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className={step.type === 'insert' ? 'text-emerald-900 font-extrabold' : ''}>
                          {step.type === 'insert' && `[+ NEW INSERT] ${step.parsedRow?.title}`}
                          {step.type === 'update' && `[~ UPDATE] ${step.parsedRow?.title}`}
                          {step.type === 'unchanged' && `[UNCHANGED] ${step.parsedRow?.title}`}
                          {step.type === 'missing' && `[MISSING ROW] ${step.dbRecord?.title}`}
                        </span>
                        <span className={`uppercase text-[10px] px-2 py-0.5 rounded font-bold ${
                          step.type === 'insert' ? 'bg-emerald-200 text-emerald-900' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {step.type}
                        </span>
                      </div>

                      {step.diffs.length > 0 && (
                        <ul className="pl-4 text-gray-600 list-disc space-y-0.5">
                          {step.diffs.map((d, i) => (
                            <li key={i}>
                              <span className="font-semibold">{d.fieldLabel}:</span>{' '}
                              {d.oldValue && <span className="line-through text-red-600 mr-1">{String(d.oldValue)}</span>}
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
                className="rounded-md bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-2xs"
              >
                {importing ? 'Applying Import & Creating Backup...' : 'Confirm & Apply Import →'}
              </button>
            </div>
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
              href="/admin/delivery-timelines?highlight=new"
              className="rounded-lg bg-[var(--primary-blue)] px-5 py-2.5 text-xs font-bold text-white hover:bg-[var(--dark-blue)] transition-colors shadow-2xs"
            >
              View Inserted Delivery Timelines →
            </Link>
            <Link
              href="/admin/procurement-steps?highlight=new"
              className="rounded-lg bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-2xs"
            >
              View Inserted Procurement Steps →
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
