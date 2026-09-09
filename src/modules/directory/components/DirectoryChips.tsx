'use client';

/**
 * ops/14 — ONE filter rendered as chips instead of a select (the design's
 * chip row, `Ops Portal.dc.html:368-374`): same `DirectoryFilterDef`, same
 * URL param, same `DIRECTORY_ALL` sentinel — a surface chooses the
 * presentation without forking its state. This is the chips UNIT only; the
 * dispatcher that picks between all eight filter kinds is school-admin/02's
 * `DirectoryFilters.tsx`, and the existing surface-specific filter bars
 * migrate onto this unit in THEIR OWN tasks. This file wraps the
 * design-system `FilterChipGroup` sibling and nothing else.
 */
import { useTranslations } from 'next-intl';

import { FilterChipGroup } from '@/modules/design-system';

import { DIRECTORY_ALL } from '../constants/directory.constants';
import type { DirectoryFilterDef } from '../types/directory.types';

interface DirectoryChipsProps {
  filter: DirectoryFilterDef;
  /** The filter's live value — the sentinel when unfiltered. */
  value: string;
  onValueChange: (value: string) => void;
}

export function DirectoryChips({ filter, value, onValueChange }: DirectoryChipsProps) {
  const t = useTranslations('DesignSystem.directory');
  const options = filter.options.map((option) => ({
    value: option.value,
    label:
      option.value === DIRECTORY_ALL && option.label.trim() === '' ? t('chipAll') : option.label,
  }));
  return (
    <FilterChipGroup
      options={options}
      value={value}
      onValueChange={onValueChange}
      ariaLabel={filter.label}
    />
  );
}
