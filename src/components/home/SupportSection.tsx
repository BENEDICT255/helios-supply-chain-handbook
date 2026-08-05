import React from 'react';
import Link from 'next/link';
import { HeadsetIcon } from '@/components/icons/Icons';

export default function SupportSection() {
  return (
    <section className="bg-white pb-16 sm:pb-20" id="support-section">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-[#EBF4FA] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Left Side: Headset Icon + Text */}
          <div className="flex items-start sm:items-center gap-5">
            <div className="shrink-0 flex items-center justify-center">
              <HeadsetIcon size={48} className="text-[#005B94]" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#004B87]">
                Need Support?
              </h2>
              <p className="mt-1 text-xs sm:text-sm font-medium text-gray-800">
                Can&apos;t find the information you&apos;re looking for?
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                Contact the Supply Chain team for further assistance.
              </p>
            </div>
          </div>

          {/* Right Side: Contact Button */}
          <div className="shrink-0 w-full sm:w-auto">
            <Link
              href="/contact"
              id="support-contact-btn"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-[#005B94] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-[#004B87] focus:outline-none focus:ring-2 focus:ring-[#005B94] focus:ring-offset-2"
            >
              Contact Supply Chain
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
