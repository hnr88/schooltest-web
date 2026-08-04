'use client';

import { Plus, UserRoundPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button, EmptyStateHero } from '@/modules/design-system';
import { LEDE_ON_WELL } from '@/modules/children/constants/components.constants';

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
