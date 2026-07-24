'use client';

import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { WizardRailStep } from '@/modules/student-wizard/types/student-wizard.types';

interface WizardStepRailProps {
  steps: readonly WizardRailStep[];
  current: number;
  maxReached: number;
  ariaLabel: string;
  onSelect: (step: number) => void;
}

// Step rail (spec 03 §2.2): a 230px column of 30px dots joined by a 1.5px
// connector, each row a jump BACK to any reached step — navigation is gated:
// a step past `maxReached` (the furthest validly completed step + 1) renders
// disabled, dimmed and unclickable (`disabled` + aria-disabled).
// State matrix, verbatim: done = navy dot + check + navy connector + #3D4A5C/500
// title; current = navy dot + number + #E4E9F2 connector + #0E2350/600; upcoming =
// white dot + #D8DFEA rule + #9AA6B8/500. The last step drops its connector.
// Below `lg` the same list lays out horizontally as a five-dot progress bar — the
// design has no breakpoint at all, and a fixed 230px rail cannot survive 375px.
export function WizardStepRail({ steps, current, maxReached, ariaLabel, onSelect }: WizardStepRailProps) {
  return (
    <nav aria-label={ariaLabel} className="lg:w-57.5 lg:shrink-0 lg:pt-2">
      <ol className="flex lg:flex-col">
        {steps.map((step, index) => {
          const isDone = index < current;
          const isCurrent = index === current;
          const isLast = index === steps.length - 1;
          const isLocked = index > maxReached;
          return (
            <li key={step.key} className={cn('flex min-w-0', !isLast && 'flex-1 lg:flex-none')}>
              <button
                type="button"
                onClick={() => onSelect(index)}
                disabled={isLocked}
                aria-disabled={isLocked || undefined}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'group flex w-full min-w-0 items-center gap-3.5 rounded-tile text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:items-stretch',
                  isLocked && 'cursor-not-allowed opacity-50',
                )}
              >
                <span className="flex flex-1 items-center self-stretch lg:flex-none lg:flex-col">
                  <span
                    className={cn(
                      'grid size-7.5 shrink-0 place-items-center rounded-full border text-meta font-semibold transition duration-200 ease-out-expo motion-reduce:transition-none',
                      !isLocked &&
                        'group-hover:scale-105 motion-reduce:group-hover:scale-100',
                      isDone || isCurrent
                        ? 'border-foreground bg-foreground text-card'
                        : 'border-portal-input bg-card text-muted-foreground',
                    )}
                  >
                    {isDone ? (
                      <Check
                        aria-hidden="true"
                        className="size-3.5 stroke-3 duration-200 animate-in zoom-in-50 motion-reduce:animate-none"
                      />
                    ) : (
                      index + 1
                    )}
                  </span>
                  {isLast ? null : (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'h-0.5 min-w-3 flex-1 transition-colors duration-200 lg:my-1 lg:h-auto lg:min-h-6.5 lg:w-0.5 lg:min-w-0',
                        isDone ? 'bg-foreground' : 'bg-border',
                      )}
                    />
                  )}
                </span>
                {/* The design's rail inks (#9AA6B8 faint, #3D4A5C done) sit on the
                    #EEF1F6 page — but #9AA6B8 is 2.6:1 there, a straight AA failure,
                    and even --muted-foreground (#64748B) is 4.23:1 on the well.
                    Both faint states collapse to --color-body (#475569, 6.74:1),
                    the one AA-safe rail ink; the current/done/upcoming hierarchy is
                    then carried by weight and the dot, not by a sub-AA tint. */}
                <span className="hidden min-w-0 flex-col pt-1.25 pb-5.5 lg:flex">
                  <span
                    className={cn(
                      'truncate text-body-md text-body transition-colors duration-200',
                      isCurrent ? 'font-semibold text-foreground' : isDone ? 'font-medium' : 'font-normal',
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="truncate text-xs text-body">{step.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
