import React from 'react';
import { ProcurementStep as ProcurementStepType } from '@/types';
import ProcessStep from './ProcessStep';

interface ProcessTimelineProps {
  steps: ProcurementStepType[];
}

export default function ProcessTimeline({ steps }: ProcessTimelineProps) {
  return (
    <div className="mx-auto max-w-3xl" role="list" aria-label="Procurement process steps">
      {steps.map((step, index) => (
        <div key={step.id} role="listitem">
          <ProcessStep step={step} isLast={index === steps.length - 1} />
        </div>
      ))}
    </div>
  );
}
