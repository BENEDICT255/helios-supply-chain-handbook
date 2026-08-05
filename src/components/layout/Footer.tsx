import React from 'react';
import Link from 'next/link';
import { navigationItems } from '@/data/navigation';
import { siteInfo } from '@/data/siteInfo';

export default function Footer() {
  return (
    <footer className="mt-auto bg-[var(--navy)] text-blue-100/70">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation Links */}
        <nav className="mb-6" aria-label="Footer navigation">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Divider */}
        <div className="border-t border-white/10 pt-6">
          <p className="text-center text-xs leading-relaxed text-blue-100/50">
            {siteInfo.disclaimer} | {siteInfo.title} | Version {siteInfo.version}
          </p>
          <p className="mt-1 text-center text-xs text-blue-100/40">
            Last Updated: {siteInfo.lastUpdated}
          </p>
        </div>
      </div>
    </footer>
  );
}
