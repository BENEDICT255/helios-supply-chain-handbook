'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchIcon } from '@/components/icons/Icons';

export default function HeroSection() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/delivery-timelines?search=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/delivery-timelines');
    }
  };

  return (
    <section
      className="relative overflow-hidden bg-[#0A192F] text-white py-16 sm:py-20 lg:py-24"
      id="hero-section"
    >
      {/* Background Image Overlay with Tower Structure */}
      <div
        className="absolute inset-0 bg-cover bg-right bg-no-repeat opacity-40 mix-blend-luminosity pointer-events-none"
        style={{ backgroundImage: `url('/images/hero-bg.png')` }}
        aria-hidden="true"
      />
      {/* Gradient Mask for readable left content */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#0A192F] via-[#0A192F]/90 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-white">
            Supply Chain Handbook
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-200 leading-relaxed">
            Your guide to procurement procedures,
            <br />
            delivery timelines and supply chain processes.
          </p>

          {/* Search Input Box */}
          <form onSubmit={handleSearch} className="mt-8 max-w-lg">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <SearchIcon size={20} className="text-gray-500" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the handbook..."
                className="w-full rounded-md border-0 bg-white py-3.5 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-500 shadow-lg focus:outline-none focus:ring-2 focus:ring-[#0070BA] transition-all"
                aria-label="Search the handbook"
                id="hero-search-input"
              />
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
