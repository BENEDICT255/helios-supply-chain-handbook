'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ExcelPlaceholder() {
  const [downloading, setDownloading] = useState<'workbook' | 'template' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (type: 'workbook' | 'template') => {
    try {
      setDownloading(type);
      setError(null);

      const url = type === 'template' ? '/api/admin/excel/export?type=template' : '/api/admin/excel/export';
      const response = await fetch(url);

      if (!response.ok) {
        let errMessage = 'Download failed';
        try {
          const json = await response.json();
          if (json.error) errMessage = json.error;
        } catch {
          errMessage = `Server returned status ${response.status}`;
        }
        throw new Error(errMessage);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = type === 'template'
        ? 'Helios_Towers_Supply_Chain_Handbook_Blank_Template.xlsx'
        : `Helios_Towers_Supply_Chain_Handbook_${new Date().toISOString().split('T')[0]}.xlsx`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'Failed to download Excel file');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border-grey)] bg-white p-6 shadow-xs space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800 font-bold ml-4">✕</button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </span>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Bulk Excel Operations</h3>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Download the current handbook workbook, edit in Excel, or upload a completed file for validation & diff preview.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleDownload('workbook')}
            disabled={downloading !== null}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-grey)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--light-grey)] transition-colors shadow-2xs disabled:opacity-50"
          >
            <svg className="h-4 w-4 text-[var(--primary-blue)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {downloading === 'workbook' ? 'Downloading...' : 'Download Workbook'}
          </button>

          <button
            type="button"
            onClick={() => handleDownload('template')}
            disabled={downloading !== null}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-grey)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--light-grey)] transition-colors shadow-2xs disabled:opacity-50"
          >
            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            {downloading === 'template' ? 'Downloading...' : 'Blank Template'}
          </button>

          <Link
            href="/admin/excel/upload"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary-blue)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--dark-blue)] transition-colors shadow-2xs"
          >
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Upload Workbook
          </Link>

          <Link
            href="/admin/import-history"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-grey)] bg-gray-50 px-3 py-2 text-xs font-semibold text-[var(--text-muted)] hover:bg-gray-100 hover:text-[var(--text-primary)] transition-colors"
          >
            Import History
          </Link>
        </div>
      </div>
    </div>
  );
}
