import React from 'react';
import ButtonLink from '@/components/ui/ButtonLink';
import { HeadsetIcon } from '@/components/icons/Icons';

export default function SupportSection() {
  return (
    <section className="bg-[var(--primary-blue)]" id="support-section">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
            <HeadsetIcon size={30} className="text-white" />
          </div>
          <h2 className="mt-5 text-2xl font-bold text-white sm:text-3xl">
            Need Support?
          </h2>
          <p className="mt-3 max-w-xl text-base text-blue-100/80">
            If you cannot find the information you need in this handbook, please
            contact the Supply Chain team for assistance.
          </p>
          <div className="mt-8">
            <ButtonLink href="/contact" variant="white" id="support-contact">
              Contact Supply Chain
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
