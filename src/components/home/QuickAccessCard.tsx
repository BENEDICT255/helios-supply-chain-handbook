import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface QuickAccessCardProps {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
  id: string;
}

export default function QuickAccessCard({
  imageSrc,
  imageAlt,
  title,
  description,
  buttonLabel,
  href,
  id,
}: QuickAccessCardProps) {
  return (
    <div className="flex flex-col items-center text-center rounded-xl border border-gray-200/90 bg-white p-7 shadow-xs transition-shadow hover:shadow-sm">
      {/* Centered Pale Blue Circle Badge with custom image */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EBF4FA] overflow-hidden p-3">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={64}
          height={64}
          className="h-full w-full object-contain mix-blend-multiply"
        />
      </div>

      {/* Centered Heading */}
      <h3 className="mt-5 text-base sm:text-lg font-bold text-[#004B87]">
        {title}
      </h3>

      {/* Centered Description */}
      <p className="mt-3 flex-1 text-xs sm:text-sm leading-relaxed text-gray-600">
        {description}
      </p>

      {/* Solid Blue Button */}
      <div className="mt-5 w-full">
        <Link
          href={href}
          id={id}
          className="inline-flex w-full items-center justify-center rounded-md bg-[#005B94] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-[#004B87] focus:outline-none focus:ring-2 focus:ring-[#005B94] focus:ring-offset-2"
        >
          {buttonLabel}
        </Link>
      </div>
    </div>
  );
}
