'use client';

import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import AdminHeader from '@/components/admin/AdminHeader';
import HeliosLogo from '@/components/layout/HeliosLogo';

export default function AdminQRCodePage() {
  const [pngDataUrl, setPngDataUrl] = useState('');
  const [svgString, setSvgString] = useState('');

  const siteUrl = useMemo(() => {
    if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_SITE_URL || '';
    return process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  }, []);

  const isUrlConfigured = !!process.env.NEXT_PUBLIC_SITE_URL;

  useEffect(() => {
    if (!siteUrl) return;

    // Generate high-resolution PNG Data URL (1024x1024)
    QRCode.toDataURL(siteUrl, {
      width: 1024,
      margin: 2,
      color: {
        dark: '#0B1726', // Helios Navy
        light: '#FFFFFF',
      },
    })
      .then((url) => setPngDataUrl(url))
      .catch((err) => console.error('PNG QR Generation Error:', err));

    // Generate SVG string
    QRCode.toString(siteUrl, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#0B1726',
        light: '#FFFFFF',
      },
    })
      .then((svg) => setSvgString(svg))
      .catch((err) => console.error('SVG QR Generation Error:', err));
  }, [siteUrl]);

  const handleDownloadPNG = () => {
    if (!pngDataUrl) return;
    const link = document.createElement('a');
    link.href = pngDataUrl;
    link.download = 'Helios_Towers_Supply_Chain_Handbook_QR.png';
    link.click();
  };

  const handleDownloadSVG = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Helios_Towers_Supply_Chain_Handbook_QR.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <AdminHeader
        title="Public Handbook QR Code"
        description="Generate high-resolution PNG and SVG QR codes pointing strictly to the public handbook homepage."
      />

      {!isUrlConfigured && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs font-semibold text-amber-900 flex items-start gap-3">
          <svg className="h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <div>
            <p className="font-bold">`NEXT_PUBLIC_SITE_URL` Environment Variable Missing</p>
            <p className="mt-0.5 text-amber-800">
              The QR code currently uses <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">{siteUrl}</code>. Before printing for production, set <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">NEXT_PUBLIC_SITE_URL</code> in Vercel.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        {/* Print-Preview Card */}
        <div className="rounded-2xl border border-[var(--border-grey)] bg-white p-8 shadow-md text-center space-y-6 flex flex-col items-center justify-between">
          <div className="w-full space-y-3">
            <div className="flex justify-center">
              <HeliosLogo />
            </div>
            <h3 className="text-base font-bold text-[var(--navy)]">Helios Towers Supply Chain Handbook</h3>
          </div>

          {/* QR Code Container */}
          <div className="p-4 bg-white rounded-xl border-2 border-gray-100 shadow-inner">
            {pngDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pngDataUrl}
                alt="Helios Towers Supply Chain Handbook Public QR Code"
                className="h-48 w-48 object-contain"
              />
            ) : (
              <div className="h-48 w-48 animate-pulse bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
                Generating QR...
              </div>
            )}
          </div>

          <div className="w-full space-y-2 pt-2 border-t border-gray-100 text-xs">
            <p className="font-semibold text-[var(--text-primary)]">
              Scan to access procurement procedures and delivery timelines.
            </p>
            <p className="font-bold text-xs uppercase tracking-wider text-[var(--primary-blue)]">
              Internal Use Only
            </p>
          </div>
        </div>

        {/* Export & Details Card */}
        <div className="rounded-xl border border-[var(--border-grey)] bg-white p-6 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)] border-b border-gray-100 pb-3">
              QR Code Download Options
            </h3>

            <dl className="space-y-3 text-xs">
              <div>
                <dt className="font-semibold text-gray-500">Target URL</dt>
                <dd className="font-mono text-[var(--primary-blue)] break-all font-bold mt-0.5">{siteUrl}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500">PNG Format</dt>
                <dd className="text-gray-600">High-Resolution (1024x1024 px) print-friendly image</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500">SVG Format</dt>
                <dd className="text-gray-600">Scalable vector graphic for graphics designers</dd>
              </div>
            </dl>
          </div>

          <div className="space-y-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={handleDownloadPNG}
              disabled={!pngDataUrl}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary-blue)] px-4 py-2.5 text-xs font-bold text-white hover:bg-[var(--dark-blue)] disabled:opacity-50 transition-colors shadow-2xs"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download High-Res PNG (1024px)
            </button>

            <button
              type="button"
              onClick={handleDownloadSVG}
              disabled={!svgString}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-grey)] bg-white px-4 py-2.5 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--light-grey)] disabled:opacity-50 transition-colors"
            >
              <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              Download Vector SVG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
