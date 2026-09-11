'use client';
/**
 * ops/14 — ONE filter rendered as chips instead of a select (the design's
 * chip row, `Ops Portal.dc.html:368-374`): same `DirectoryFilterDef`, same
 * URL param, same `DIRECTORY_ALL` sentinel — a surface chooses the
 * presentation without forking its state. This is the chips UNIT only; the
 * dispatcher that picks between all eight filter kinds is school-admin/02's
 * `DirectoryFilters.tsx`.
 *
 * filters-audit 2026-09-11 — the chips draw the design's own pills rather than
 * the design-system `FilterChipGroup` sibling: the canonical chip is the
 * parent-portal 28px box, while THIS design draws a 34px pill (13px/500 ink on
 * a 1.5px #D8DFEA border, `:370`, active = navy #0E2350 fill via `:979`'s
 * `chip(on)`). The design-system core stays untouched; the a11y contract
 * (role=group, aria-pressed, focus ring, coarse-pointer target) is kept.
 */
import { useTranslations } from 'next-intl';

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
  return (
    <div role="group" aria-label={filter.label} data-slot="directory-chips" className="flex flex-wrap gap-2">
      {filter.options.map((option) => {
        const label =
          option.value === DIRECTORY_ALL && option.label.trim() === ''
            ? t('chipAll')
            : option.label;
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            data-slot="directory-chip"
            data-value={option.value}
            onClick={() => onValueChange(option.value)}
            className={`inline-flex h-[34px] items-center rounded-full border-[1.5px] px-3.5 text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none pointer-coarse:min-h-11 ${
              active
                ? 'border-[#0E2350] bg-[#0E2350] text-white'
                : 'border-[#D8DFEA] bg-white text-[#3D4A5C] hover:border-[#0E2350]'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
