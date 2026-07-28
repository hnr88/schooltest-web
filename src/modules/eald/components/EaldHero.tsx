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
  minHeight = 'min-h-72 sm:min-h-96 lg:min-h-120',
}: EaldHeroProps) {
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
              minHeight,
              centered
                ? 'items-center justify-center text-center'
                : 'justify-end lg:max-w-2xl',
            )}
          >
            {badge ? (
              <Badge className="h-auto gap-2 bg-white/10 px-4 py-1.5 text-white ring-1 ring-white/20">
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
