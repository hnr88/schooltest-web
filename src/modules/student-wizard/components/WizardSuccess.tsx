'use client';

import { Check } from 'lucide-react';

interface WizardSuccessProps {
  title: string;
  body: string;
}

// Submit confirmation. `st-pop-in` is the design's own entrance primitive
// (spec 04 §2: `opacity 0→1, scale .96→1, 180ms ease`) — expressed here with
// tw-animate-css's `fade-in zoom-in-95`, which is that curve exactly and ships
// already. `role="status"` announces it; reduced motion drops the transform.
export function WizardSuccess({ title, body }: WizardSuccessProps) {
  return (
    <div
      role="status"
      data-slot="wizard-success"
      className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center duration-200 ease-out animate-in fade-in zoom-in-95 motion-reduce:animate-none"
    >
      <span
        aria-hidden="true"
        className="grid size-16 place-items-center rounded-full bg-success-soft-2 text-success-strong duration-300 ease-out-expo animate-in zoom-in-50 motion-reduce:animate-none"
      >
        <Check className="size-8 stroke-3" />
      </span>
      <span className="flex flex-col gap-1.5">
        <span className="text-xl font-semibold text-foreground">{title}</span>
        <span className="text-body-sm text-body">{body}</span>
      </span>
    </div>
  );
}
