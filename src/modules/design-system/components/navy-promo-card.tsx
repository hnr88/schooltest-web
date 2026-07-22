import Image from 'next/image';

import { cn } from '@/lib/utils';

import type { NavyPromoCardProps } from '@/modules/design-system/types/record.types';

// Canonical NavyGradientPromo (§01 — Parent overview "Running low on credits",
// Landing CTA): linear-gradient(135deg,#0E2350,#16326E), radius 16px, padding 22px,
// gap 10px; title 15.5/700 #fff; body 13.5/1.5 #A9BADC; teal CTA.
// The watermark is the SHIPPED brand mark at opacity .12, inverted — the canonical
// treatment. It is optional and defaults to off, because a promo with no real asset
// must not invent one.
function NavyPromoCard({ title, body, action, watermarkSrc, className }: NavyPromoCardProps) {
  return (
    <section
      data-slot="navy-promo-card"
      className={cn(
        'relative flex flex-col gap-2.5 overflow-hidden rounded-panel bg-navy-promo p-5.5',
        className,
      )}
    >
      {watermarkSrc ? (
        <Image
          src={watermarkSrc}
          alt=""
          aria-hidden="true"
          width={130}
          height={130}
          className="pointer-events-none absolute -top-5 -right-6.5 h-32.5 w-auto opacity-12 brightness-0 invert"
        />
      ) : null}
      <h3 className="relative text-lede font-bold text-balance text-primary-foreground">
        {title}
      </h3>
      <p className="relative text-body-sm text-navy-body">{body}</p>
      {action ? <div className="relative mt-1 flex flex-wrap gap-2.5">{action}</div> : null}
    </section>
  );
}

export { NavyPromoCard };
