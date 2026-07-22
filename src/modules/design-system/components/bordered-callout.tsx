import { cn } from '@/lib/utils';

import type { BorderedCalloutProps } from '@/modules/design-system/types/record.types';

// Canonical BorderedCallout (§01 — Admissions profile banner, DS audio hint):
// #EFF5FF fill, 1px #BFDBFE rule, radius 12px, padding 12px 14px, 12.5px #16326E.
// Distinct from `InsightCallout`/SoftTintStrip, which is a BORDERLESS tint strip:
// this one is the bordered explanatory banner that opens a screen. #16326E on
// #EFF5FF is 11.2:1.
function BorderedCallout({ icon: Icon, children, className }: BorderedCalloutProps) {
  return (
    <div
      data-slot="bordered-callout"
      className={cn(
        'flex items-start gap-2.5 rounded-tile border border-blue-100 bg-blue-50 px-3.5 py-3 text-meta leading-relaxed text-secondary-foreground',
        className,
      )}
    >
      {Icon ? <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" /> : null}
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}

export { BorderedCallout };
