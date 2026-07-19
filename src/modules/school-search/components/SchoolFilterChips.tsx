'use client';

import { useTranslations } from 'next-intl';

import { FilterChip } from '@/modules/school-search/components/FilterChip';
import {
  SCHOOL_TYPES,
  SECTOR_LABEL_KEYS,
  SECTORS,
  STATES,
  TOGGLE_KEYS,
} from '@/modules/school-search/constants/school-search.constants';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';
import type { ToggleKey } from '@/modules/school-search/types/school-search.types';

function SchoolFilterChips() {
  const t = useTranslations('SchoolSearch');
  const states = useSchoolSearchStore((s) => s.states);
  const sectors = useSchoolSearchStore((s) => s.sectors);
  const schoolTypes = useSchoolSearchStore((s) => s.schoolTypes);
  const scholarshipAvailable = useSchoolSearchStore((s) => s.scholarshipAvailable);
  const atarAvailable = useSchoolSearchStore((s) => s.atarAvailable);
  const elicos = useSchoolSearchStore((s) => s.elicos);
  const toggleState = useSchoolSearchStore((s) => s.toggleState);
  const toggleSector = useSchoolSearchStore((s) => s.toggleSector);
  const toggleSchoolType = useSchoolSearchStore((s) => s.toggleSchoolType);
  const setToggle = useSchoolSearchStore((s) => s.setToggle);

  const toggleValues: Record<ToggleKey, boolean> = {
    scholarshipAvailable,
    atarAvailable,
    elicos,
  };

  return (
    <div
      role="group"
      aria-label={t('aria.filters')}
      className="flex flex-wrap items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out motion-reduce:animate-none"
    >
      {STATES.map((code) => (
        <FilterChip key={code} active={states.includes(code)} onClick={() => toggleState(code)}>
          {t(`states.${code}`)}
        </FilterChip>
      ))}
      {SECTORS.map((sector) => (
        <FilterChip
          key={sector}
          active={sectors.includes(sector)}
          onClick={() => toggleSector(sector)}
        >
          {t(`sectors.${SECTOR_LABEL_KEYS[sector]}`)}
        </FilterChip>
      ))}
      {SCHOOL_TYPES.map((type) => (
        <FilterChip
          key={type}
          active={schoolTypes.includes(type)}
          onClick={() => toggleSchoolType(type)}
        >
          {t(`schoolTypes.${type}`)}
        </FilterChip>
      ))}
      {TOGGLE_KEYS.map((key) => (
        <FilterChip
          key={key}
          active={toggleValues[key]}
          onClick={() => setToggle(key, !toggleValues[key])}
        >
          {t(`toggles.${key}`)}
        </FilterChip>
      ))}
    </div>
  );
}

export { SchoolFilterChips };
