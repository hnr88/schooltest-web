import { cn } from '@/lib/utils';

import type {
  KeyValueListProps,
  KeyValueRowProps,
} from '@/modules/design-system/types/record.types';

// Canonical KeyValueRow (§02.15 — Child profile enrolment/guardian panels, Billing
// summary, Checkout): space-between, 13.5–14px, key #64748B, value 600–700 #0E2350.
// The audit found five of these rendered at a 0px gap — "Year level/Year 7" welded
// to "Nationality/Australian" — because the panels used a bare <dl> with no rhythm.
// The list owns the 12px gap and the hairline so no consumer has to remember it.
function KeyValueList({ className, ...props }: KeyValueListProps) {
  return (
    <dl
      data-slot="key-value-list"
      className={cn('flex flex-col gap-3 text-body-sm', className)}
      {...props}
    />
  );
}

function KeyValueRow({ label, children, className }: KeyValueRowProps) {
  return (
    <div
      data-slot="key-value-row"
      className={cn(
        'flex items-baseline justify-between gap-4 border-b border-divider pb-3 last:border-b-0 last:pb-0',
        className,
      )}
    >
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-semibold text-foreground">{children}</dd>
    </div>
  );
}

export { KeyValueList, KeyValueRow };
