import React from 'react';
import Image from 'next/image';

export default function WelcomeSection() {
  return (
    <section className="bg-white pt-10 pb-4 sm:pt-12 sm:pb-6" id="welcome-section">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 lg:gap-12">
          {/* Circular icon badge with user's custom welcome.jpeg image */}
          <div className="shrink-0 flex items-center justify-center h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-[#EBF4FA] overflow-hidden p-4">
            <Image
              src="/images/welcome.jpeg"
              alt="Welcome Handshake"
              width={100}
              height={100}
              className="h-full w-full object-contain mix-blend-multiply"
              priority
            />
          </div>

          {/* Welcome Text Content */}
          <div className="flex-1 max-w-2xl space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-[#004B87] sm:text-3xl">
              Welcome
            </h2>
            <p className="text-sm sm:text-base font-medium text-gray-800 leading-relaxed">
              Welcome to the Helios Towers Supply Chain Handbook.
            </p>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              This handbook provides employees with clear guidance on procurement procedures,
              expected delivery timelines and frequently asked questions.
            </p>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Use the navigation menu or the search function to quickly find the information you need.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
