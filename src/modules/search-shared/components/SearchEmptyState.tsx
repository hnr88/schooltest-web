'use client';

import { RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button, EmptyState } from '@/modules/design-system';
import type { SearchEmptyStateProps } from '@/modules/search-shared/types/search-shared.types';

// Canonical in-panel EmptyState (DS §03): 52px soft-blue medallion inside a dashed
// tile. The hand-rolled medallion this replaced re-drew the same object with a
// different radius, which is exactly how two surfaces stop looking like one system.
function SearchEmptyState({ icon: Icon, title, sub, onReset }: SearchEmptyStateProps) {
  const t = useTranslations('Search');
  return (
    <div
      data-slot="search-empty-state"
      className="animate-in duration-300 ease-out-expo fade-in slide-in-from-bottom-2 motion-reduce:animate-none"
    >
      <EmptyState
        tone="brand"
        icon={Icon}
        title={title}
        description={sub}
        className="border-border bg-card"
        action={
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw aria-hidden="true" />
            {t('resetFilters')}
          </Button>
        }
      />
    </div>
  );
}

export { SearchEmptyState };
