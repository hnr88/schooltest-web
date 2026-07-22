'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import type { GaugeRingProps } from '@/modules/design-system/types/design-system.types';

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function GaugeRing({ value, display, caption, ariaLabel, className }: GaugeRingProps) {
  const [drawn, setDrawn] = useState(false);
  const safeValue = Math.min(100, Math.max(0, value));

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      data-slot="gauge-ring"
      role="img"
      aria-label={ariaLabel}
      className={cn('relative grid size-30 place-items-center', className)}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true" className="size-30 -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="11"
          className="stroke-divider"
        />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE - (drawn ? safeValue : 0) * (CIRCUMFERENCE / 100)}
          className="stroke-accent transition-[stroke-dashoffset] duration-700 ease-out-expo motion-reduce:transition-none"
        />
      </svg>
      <span className="absolute flex max-w-20 flex-col items-center gap-0.5 text-center">
        <span className="text-stat-md font-bold text-foreground tabular-nums">{display}</span>
        {caption ? (
          <span className="text-micro leading-tight text-muted-foreground">{caption}</span>
        ) : null}
      </span>
    </div>
  );
}

export { GaugeRing };
