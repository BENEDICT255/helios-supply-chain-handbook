'use client';

import React from 'react';

export default function ExcelPlaceholder() {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border-grey)] bg-[var(--light-grey)] p-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Excel Integration</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Bulk import and export functionality for delivery timelines, procurement steps and FAQs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled
            className="rounded-md border border-[var(--border-grey)] bg-white px-4 py-2 text-xs font-semibold text-[var(--text-muted)] opacity-50 cursor-not-allowed"
          >
            Download Template
          </button>
          <button
            type="button"
            disabled
            className="rounded-md border border-[var(--border-grey)] bg-white px-4 py-2 text-xs font-semibold text-[var(--text-muted)] opacity-50 cursor-not-allowed"
          >
            Upload Workbook
          </button>
        </div>
      </div>
      <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-center">
        <p className="text-xs font-semibold text-amber-700">Coming in Phase 3</p>
      </div>
    </div>
  );
}
