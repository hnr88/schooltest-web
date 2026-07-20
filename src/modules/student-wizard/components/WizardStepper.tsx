'use client';

import { Check } from 'lucide-react';
import { Fragment } from 'react';

import { cn } from '@/lib/utils';

interface WizardStepperProps {
  steps: readonly string[];
  current: number;
  caption: string;
}

// §5.14 stepper: done = success circle + check (label 600), current = primary
// circle w/ number (label 700), upcoming = muted circle (label #94A3B8); 56×2px
// connectors success/border. Colors transition, never snap (motion baseline).
export function WizardStepper({ steps, current, caption }: WizardStepperProps) {
  return (
    <div className="flex flex-col gap-3 duration-300 ease-out animate-in slide-in-from-bottom-1 motion-reduce:animate-none">
      <ol className="flex items-start">
        {steps.map((label, index) => {
          const isDone = index < current;
          const isCurrent = index === current;
          return (
            <Fragment key={label}>
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-3.5 h-0.5 w-14 shrink-0 rounded-full transition-colors duration-200',
                    index <= current ? 'bg-success' : 'bg-border',
                  )}
                />
              ) : null}
              <li className="flex flex-col items-center gap-2">
                <span
                  aria-current={isCurrent ? 'step' : undefined}
                  className={cn(
                    'grid size-7 place-items-center rounded-full text-caption font-bold transition-colors duration-200',
                    isDone && 'bg-success text-success-foreground',
                    isCurrent && 'bg-primary text-primary-foreground',
                    !isDone && !isCurrent && 'bg-border text-slate-500',
                  )}
                >
                  {isDone ? (
                    <Check
                      aria-hidden="true"
                      className="size-4 duration-200 animate-in zoom-in-50 motion-reduce:animate-none"
                    />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    'text-caption whitespace-nowrap transition-colors duration-200',
                    isDone && 'font-semibold text-foreground',
                    isCurrent && 'font-bold text-foreground',
                    !isDone && !isCurrent && 'font-medium text-slate-400',
                  )}
                >
                  {label}
                </span>
              </li>
            </Fragment>
          );
        })}
      </ol>
      <p className="text-sm text-muted-foreground">{caption}</p>
    </div>
  );
}
