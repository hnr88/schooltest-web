'use client';

import { Plus, UserRoundPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button, EmptyStateHero } from '@/modules/design-system';

// §A.7 true zero state — the portal list slice has no zero-children branch, so the
// designed one is the App-chrome empty state: 96px blue medallion, 27px headline,
// 15/1.6 lede, one action. Its student-code card is BLOCKED (no code-verify or
// link endpoint exists — G19), so the single path is the real add-child wizard.
//
// EmptyStateHero hard-codes `text-muted-foreground` on its lede (#64748B, 4.23:1
// on the #EEF2F7 well). The design-system is read-only from here, so the lede is
// re-inked to --color-body (6.74:1) from the wrapper; `p + p` is the lede
// specifically, so the title keeps --foreground.
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
          <Button
            href="/dashboard/children/new"
            size="lg"
            className="h-12 rounded-full bg-foreground px-6 font-semibold text-card hover:bg-navy-800"
          >
            <Plus aria-hidden="true" className="size-4" strokeWidth={2.2} />
            {t('addChild')}
          </Button>
        }
      />
    </div>
  );
}
