'use client';

import { useTranslations } from 'next-intl';

import { Button, NavyPromoCard } from '@/modules/design-system';

// Canonical §3b gradient promo (App Screens 2a:2508) — COMPONENT G, and the
// strongest variety flag on the screen: it sits 18px below a white bordered list
// with maximum contrast — 135deg #0E2350→#16326E, NO border, NO shadow, and a
// 15.5px title that deliberately does NOT enter the panel-heading hierarchy.
// It is the one dark surface in the canvas, which is what stops every remaining
// emphasis from competing as another white card.
// No watermark is passed: the prop exists for the shipped brand mark, and a promo
// with no real asset must not invent one.
export function DashboardPromo() {
  const t = useTranslations('Dashboard');

  return (
    <NavyPromoCard
      title={t('promoTitle')}
      body={t('promoDescription')}
      action={
        <Button href="/dashboard/search?mode=agents" variant="accent" size="sm">
          {t('findAgents')}
        </Button>
      }
    />
  );
}
