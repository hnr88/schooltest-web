import { BarChart3, Sparkles, Target, TrendingUp } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Container, Eyebrow, Section } from '@/modules/design-system';
import { ScrollReveal } from '@/modules/landing';

const CARDS = [
  {
    titleKey: 'home.whatYouGet.diagnoseTitle',
    descKey: 'home.whatYouGet.diagnoseDescription',
    href: '/eald/diagnose',
    icon: BarChart3,
    dark: false,
    iconWrap: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    titleKey: 'home.whatYouGet.teachTitle',
    descKey: 'home.whatYouGet.teachDescription',
    href: '/eald/teach',
    icon: Sparkles,
    dark: true,
    iconWrap: 'bg-navy-800',
    iconColor: 'text-teal-400',
  },
  {
    titleKey: 'home.whatYouGet.trackTitle',
    descKey: 'home.whatYouGet.trackDescription',
    href: '/eald/track',
    icon: TrendingUp,
    dark: false,
    iconWrap: 'bg-teal-50',
    iconColor: 'text-teal-700',
  },
  {
    titleKey: 'home.whatYouGet.predictTitle',
    descKey: 'home.whatYouGet.predictDescription',
    href: '/eald/predict',
    icon: Target,
    dark: false,
    iconWrap: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
] as const;

async function WhatYouGetSection() {
  const t = await getTranslations('Eald');

  return (
    <Section>
      <Container className="max-w-eald">
        <div className="text-center">
          <Eyebrow>{t('home.whatYouGet.eyebrow')}</Eyebrow>
          <h2 className="mx-auto mt-3 max-w-2xl text-h2 font-bold tracking-tight text-balance text-foreground sm:text-display">
            {t('home.whatYouGet.title')}
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <ScrollReveal key={card.href} delay={i * 90}>
                <Link
                  href={card.href}
                  className={cn(
                    'flex h-full flex-col rounded-2xl p-7 transition-[transform,box-shadow] duration-200 ease-out-expo hover:-translate-y-1 hover:shadow-lg',
                    card.dark
                      ? 'bg-navy-900'
                      : 'border border-border bg-surface-inset',
                  )}
                >
                  <span
                    className={cn(
                      'inline-grid size-11 place-items-center rounded-xl',
                      card.iconWrap,
                    )}
                  >
                    <Icon className={cn('size-5', card.iconColor)} />
                  </span>
                  <p
                    className={cn(
                      'mt-4 text-lg font-bold',
                      card.dark ? 'text-white' : 'text-foreground',
                    )}
                  >
                    {t(card.titleKey)}
                  </p>
                  <p
                    className={cn(
                      'mt-2 text-body-md leading-relaxed',
                      card.dark ? 'text-navy-muted' : 'text-body',
                    )}
                  >
                    {t(card.descKey)}
                  </p>
                  <span
                    className={cn(
                      'mt-auto pt-5 text-body-sm font-semibold',
                      card.dark ? 'text-teal-400' : 'text-blue-600',
                    )}
                  >
                    {t('shared.readMore')}
                  </span>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

export { WhatYouGetSection };
