'use client';

import { Plus, UserRoundPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button, EmptyStateHero } from '@/modules/design-system';

// C-UI-MYCHILDREN empty state — the canonical page-level treatment (96px soft
// blue medallion, 27px title, centred CTA), not the small in-panel tile.
//
// This hero renders DIRECTLY on the dashboard well (#EEF2F7), and EmptyStateHero
// hard-codes `text-muted-foreground` (#64748B) on its lede — 4.23:1, under the
// 4.5:1 body floor. The design-system is read-only from here, so the lede is
// re-inked to --color-body (#475569, 6.74:1) from the wrapper. `p + p` is the
// lede specifically (the title is the first `p`), so the 24px title keeps
// --foreground. Delete this override once EmptyStateHero takes a `descriptionClassName`
// (or inks its lede with `text-body` itself) — see the round report.
const LEDE_ON_WELL = '[&_p+p]:text-body';

export function ChildrenEmptyState() {
  const t = useTranslations('Children');

  return (
    <div className="grid flex-1 place-items-center">
      <EmptyStateHero
        className={LEDE_ON_WELL}
        icon={UserRoundPlus}
        title={t('emptyTitle')}
        description={t('emptyDescription')}
        action={
          <Button href="/dashboard/children/new" size="lg">
            <Plus aria-hidden="true" className="size-4" />
            {t('addStudent')}
          </Button>
        }
      />
    </div>
  );
}
