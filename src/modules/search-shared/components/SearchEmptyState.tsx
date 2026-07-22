'use client';

import { RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import type { SearchEmptyStateProps } from '@/modules/search-shared/types/search-shared.types';

function SearchEmptyState({ icon: Icon, title, sub, onReset }: SearchEmptyStateProps) {
  const t = useTranslations('Search');
  return (
    <div
      data-slot="search-empty-state"
      className="flex animate-in flex-col items-center gap-3 py-16 text-center duration-300 ease-out fade-in slide-in-from-bottom-2 motion-reduce:animate-none"
    >
      <span
        aria-hidden="true"
        className="flex size-13 items-center justify-center rounded-2xl bg-blue-50 text-primary"
      >
        <Icon className="size-5.5" />
      </span>
      <p className="text-button font-semibold text-navy-950">{title}</p>
      <p className="max-w-70 text-caption text-body">{sub}</p>
      <Button variant="outline" size="sm" onClick={onReset}>
        <RotateCcw aria-hidden="true" />
        {t('resetFilters')}
      </Button>
    </div>
  );
}

export { SearchEmptyState };
