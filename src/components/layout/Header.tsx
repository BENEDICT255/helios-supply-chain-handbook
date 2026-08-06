'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDownIcon, MenuIcon, CloseIcon } from '@/components/icons/Icons';
import HeliosLogo from './HeliosLogo';
import MobileNavigation from './MobileNavigation';

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#0B1726] text-white shadow-md border-b border-white/10 w-full">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo Only */}
        <div className="shrink-0">
          <Link
            href="/"
            className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded"
            id="header-brand"
          >
            <HeliosLogo />
          </Link>
        </div>

        {/* Desktop Header Navigation Panel */}
        <nav aria-label="Main navigation" className="hidden lg:flex items-center">
          <ul className="flex items-center gap-5 sm:gap-7 text-xs sm:text-sm font-medium">
            {/* 1. Home */}
            <li>
              <Link
                href="/"
                className={`inline-block py-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                  pathname === '/'
                    ? 'border-b-2 border-[#00A8E8] text-white font-bold'
                    : 'text-gray-300 hover:text-white'
                }`}
                aria-current={pathname === '/' ? 'page' : undefined}
              >
                Home
              </Link>
            </li>

            {/* 2. Procurement Process */}
            <li>
              <Link
                href="/procurement-process"
                className={`inline-block py-1 whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                  pathname.startsWith('/procurement-process')
                    ? 'border-b-2 border-[#00A8E8] text-white font-bold'
                    : 'text-gray-300 hover:text-white'
                }`}
                aria-current={pathname.startsWith('/procurement-process') ? 'page' : undefined}
              >
                Procurement Process
              </Link>
            </li>

            {/* 3. Delivery Timelines v */}
            <li>
              <Link
                href="/delivery-timelines"
                className={`inline-flex items-center gap-1 py-1 whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                  pathname.startsWith('/delivery-timelines')
                    ? 'border-b-2 border-[#00A8E8] text-white font-bold'
                    : 'text-gray-300 hover:text-white'
                }`}
                aria-current={pathname.startsWith('/delivery-timelines') ? 'page' : undefined}
              >
                <span>Delivery Timelines</span>
                <ChevronDownIcon size={14} className="text-gray-300 shrink-0" />
              </Link>
            </li>

            {/* 4. Frequently Asked Questions */}
            <li>
              <Link
                href="/faqs"
                className={`inline-block py-1 transition-colors leading-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                  pathname.startsWith('/faqs')
                    ? 'border-b-2 border-[#00A8E8] text-white font-bold'
                    : 'text-gray-300 hover:text-white'
                }`}
                aria-current={pathname.startsWith('/faqs') ? 'page' : undefined}
              >
                <span className="block">Frequently Asked</span>
                <span className="block">Questions</span>
              </Link>
            </li>

            {/* 5. Contact Supply Chain */}
            <li>
              <Link
                href="/contact"
                className={`inline-block py-1 whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                  pathname.startsWith('/contact')
                    ? 'border-b-2 border-[#00A8E8] text-white font-bold'
                    : 'text-gray-300 hover:text-white'
                }`}
                aria-current={pathname.startsWith('/contact') ? 'page' : undefined}
              >
                Contact Supply Chain
              </Link>
            </li>
          </ul>
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex lg:hidden items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={mobileMenuOpen ? 'Close main menu' : 'Open main menu'}
        >
          {mobileMenuOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileNavigation isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </header>
  );
}

