import { cn } from '@/lib/utils';

import type { NavyPanelProps } from '@/modules/design-system/types/record.types';

// Canonical NavyPanel (§01 — Billing "Current balance", Create test summary, School
// settings current plan, Parent sidebar test credits, Result hero):
//   #0E2350, radius 16px, padding 22px, NO border
//   eyebrow 12.5/700/.06em #8FA3C7 · value 30–34/700 #FFF · link 13.5/600 #2DD4BF
// The missing "one dark surface per screen". Without it every emphasis on a screen
// competes as another white card, which is exactly the flat, repeated look the
// dashboard has now.
// #8FA3C7 on #0E2350 is 5.99:1 and #2DD4BF is 8.21:1 — both clear AA on navy.
function NavyPanel({ eyebrow, value, caption, action, children, className }: NavyPanelProps) {
  return (
    <section
      data-slot="navy-panel"
      className={cn('flex flex-col gap-2.5 rounded-panel bg-navy-900 p-5.5', className)}
    >
      {eyebrow ? (
        <p className="text-meta font-bold tracking-overline text-navy-muted uppercase">{eyebrow}</p>
      ) : null}
      {value ? (
        <p className="text-stat-lg leading-none font-bold text-primary-foreground tabular-nums">
          {value}
        </p>
      ) : null}
      {caption ? <p className="text-body-sm text-navy-body">{caption}</p> : null}
      {children}
      {action ? <div className="mt-1 flex flex-wrap items-center gap-3">{action}</div> : null}
    </section>
  );
}

export { NavyPanel };
