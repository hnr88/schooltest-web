import Image from 'next/image';

import { cn } from '@/lib/utils';
import { Badge, Button, Container, Section } from '@/modules/design-system';
import type { EaldHeroProps } from '@/modules/eald/types/eald.types';

function EaldHero({
  badge,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  subText,
  imageSrc = '/images/maksym-ivanov-9M9VYzjHYB8-unsplash.jpg',
  imageAlt = '',
  centered = true,
  minHeight,
  eyebrow,
  breadcrumb,
  stats,
}: EaldHeroProps) {
  // The centred card keeps its historical default height so the four wave-3
  // heroes render exactly as they do today; the full-bleed home band (task 05,
  // Home v2:74–97) derives its own 520px design height unless told otherwise.
  const height = minHeight ?? (centered ? 'min-h-72 sm:min-h-96 lg:min-h-120' : 'min-h-100 lg:min-h-130');

  // Full-bleed variant (Home v2:74–97): edge-to-edge photo under a navy
  // left-to-right scrim, breadcrumb inside the band, content column capped at
  // 40rem, and the stat strip in its own hairline-topped band on the same
  // photo. The `centered` default stays `true`, so every consumer that omits
  // it still takes the card below unchanged.
  if (!centered) {
    return (
      <Section className="relative overflow-hidden bg-navy-950 py-0">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          // LCP element: the photo now spans the viewport instead of a
          // contained card, so the hint follows the new box.
          sizes="100vw"
          className="object-cover opacity-55"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-950/85 to-navy-950/30"
        />

        <div className="relative">
          <Container className={cn('flex max-w-eald flex-col justify-center py-20 sm:py-24', height)}>
            {breadcrumb ? (
              // Consumer-side ink overrides: PublicBreadcrumb ships white-
              // surface colours; on the scrim it reads in the design's
              // navy-soft/navy-muted with white hover.
              <div className="mb-5 [&_a:hover]:text-white [&_a]:text-navy-soft [&_[data-slot=breadcrumb-page]]:text-navy-muted [&_[data-slot=breadcrumb-separator]]:text-navy-muted">
                {breadcrumb}
              </div>
            ) : null}

            <div className="max-w-2xl">
              {eyebrow ? (
                <p className="text-xs font-bold tracking-eyebrow text-accent-on-dark-hover uppercase">
                  {eyebrow}
                </p>
              ) : null}

              <h1 className={cn('text-display font-bold text-balance text-white text-shadow-lg', eyebrow ? 'mt-4' : null)}>
                {title}
              </h1>

              {subtitle ? (
                <p className="mt-5 max-w-xl text-lg text-pretty text-navy-soft">{subtitle}</p>
              ) : null}

              {primaryCta || secondaryCta ? (
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  {primaryCta ? (
                    <Button size="xl" href={primaryCta.href}>
                      {primaryCta.label}
                    </Button>
                  ) : null}
                  {secondaryCta ? (
                    <Button variant="white" size="xl" href={secondaryCta.href}>
                      {secondaryCta.label}
                    </Button>
                  ) : null}
                </div>
              ) : null}

              {subText ? <p className="mt-6 text-sm text-navy-soft">{subText}</p> : null}
            </div>
          </Container>

          {stats ? (
            // Home v2:90–95: hairline-topped translucent band on the same
            // photo; the cells' padding and dividers are consumer overrides —
            // the StatStrip primitive itself is untouched.
            <div className="border-t border-white/15 bg-navy-950/55 backdrop-blur-sm">
              <Container className="max-w-eald">{stats}</Container>
            </div>
          ) : null}
        </div>
      </Section>
    );
  }

  return (
    <Section className="bg-gradient-to-b from-white to-background py-5 sm:py-6">
      <Container className="max-w-eald">
        <div className="relative overflow-hidden rounded-4xl bg-navy-900 shadow-xl">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            sizes="(min-width: 1380px) 1320px, calc(100vw - 2.5rem)"
            className="object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-eald-hero-scrim" />

          <div
            className={cn(
              'relative flex flex-col gap-6 px-6 py-16 sm:px-12 sm:py-20',
              height,
              centered
                ? 'items-center justify-center text-center'
                : 'justify-end lg:max-w-2xl',
            )}
          >
            {badge ? (
              // The vendored Badge is `w-fit` + nowrap, so a long badge string
              // overflowed the 375px viewport by 8px and made the whole page
              // scroll sideways. Wrapping is a consumer-side override; the
              // primitive itself stays untouched.
              <Badge className="h-auto max-w-full gap-2 bg-white/10 px-4 py-1.5 text-center whitespace-normal text-white ring-1 ring-white/20">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-teal-400" />
                {badge}
              </Badge>
            ) : null}

            <h1 className="max-w-3xl text-display font-bold text-balance text-white text-shadow-lg">
              {title}
            </h1>

            {subtitle ? (
              <p className="max-w-xl text-lg text-white text-shadow-sm">{subtitle}</p>
            ) : null}

            {primaryCta || secondaryCta ? (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {primaryCta ? (
                  <Button size="xl" href={primaryCta.href}>
                    {primaryCta.label}
                  </Button>
                ) : null}
                {secondaryCta ? (
                  <Button variant="white" size="xl" href={secondaryCta.href}>
                    {secondaryCta.label}
                  </Button>
                ) : null}
              </div>
            ) : null}

            {subText ? (
              <p className="text-sm text-white">{subText}</p>
            ) : null}
          </div>
        </div>
      </Container>
    </Section>
  );
}

export { EaldHero };
