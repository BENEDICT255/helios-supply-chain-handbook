import React from 'react';
import { ProcurementStep as ProcurementStepType } from '@/types';
import { UserIcon, ClockSmallIcon } from '@/components/icons/Icons';

interface ProcessStepProps {
  step: ProcurementStepType;
  isLast: boolean;
}

export default function ProcessStep({ step, isLast }: ProcessStepProps) {
  return (
    <div className="relative flex gap-4 pb-8 sm:gap-6">
      {/* Timeline line */}
      {!isLast && (
        <div
          className="absolute left-5 top-12 bottom-0 w-px bg-[var(--border-grey)] sm:left-6"
          aria-hidden="true"
        />
      )}

      {/* Step number circle */}
      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary-blue)] text-sm font-bold text-white sm:h-12 sm:w-12 sm:text-base">
        {step.id}
      </div>

      {/* Step content */}
      <div className="flex-1 rounded-xl border border-[var(--border-grey)] bg-white p-5 transition-shadow hover:shadow-sm">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {step.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
          {step.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--pale-blue)] px-3 py-1 font-medium text-[var(--dark-blue)]">
            <UserIcon size={14} />
            {step.responsibleParty}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--light-grey)] px-3 py-1 font-medium text-[var(--text-muted)]">
            <ClockSmallIcon size={14} />
            {step.expectedDuration}
          </span>
        </div>
      </div>
    </div>
  );
}
