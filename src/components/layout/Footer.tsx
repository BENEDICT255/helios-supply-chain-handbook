import React from 'react';
import { siteInfo } from '@/data/siteInfo';

export default function Footer() {
  return (
    <footer className="mt-auto bg-[#0B1726] text-gray-400 border-t border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8 text-xs font-medium">
        {/* Left Side Info */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
          <span>&copy; 2026 Helios Towers</span>
          <span className="text-gray-600">|</span>
          <span>Supply Chain Handbook</span>
          <span className="text-gray-600">|</span>
          <span>{siteInfo.disclaimer}</span>
          <span className="text-gray-600">|</span>
          <span>Version {siteInfo.version}</span>
        </div>

        {/* Right Side Last Updated */}
        <div className="shrink-0 text-center sm:text-right text-gray-400">
          Last Updated: {siteInfo.lastUpdated}
        </div>
      </div>
    </footer>
  );
}
