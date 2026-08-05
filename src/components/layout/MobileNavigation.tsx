'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationItems } from '@/data/navigation';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div
      ref={navRef}
      id="mobile-navigation"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
      className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <nav className="border-t border-white/10 bg-[var(--navy)] px-4 pb-4 pt-2" aria-label="Mobile navigation">
        <ul className="flex flex-col gap-1">
          {navigationItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`block rounded-md px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-blue-100/70 hover:bg-white/5 hover:text-white'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
