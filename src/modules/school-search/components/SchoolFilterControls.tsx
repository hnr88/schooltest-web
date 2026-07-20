'use client';

import { useTranslations } from 'next-intl';

import { FilterChip } from '@/modules/school-search/components/FilterChip';
import { SchoolFilterSection } from '@/modules/school-search/components/SchoolFilterSection';
import {
  SCHOOL_TYPES,
  SECTOR_LABEL_KEYS,
  SECTORS,
  STATES,
  TOGGLE_KEYS,
} from '@/modules/school-search/constants/school-search.constants';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';

function SchoolFilterControls() {
  const t = useTranslations('SchoolSearch');
  const states = useSchoolSearchStore((state) => state.states);
  const sectors = useSchoolSearchStore((state) => state.sectors);
  const schoolTypes = useSchoolSearchStore((state) => state.schoolTypes);
  const scholarshipAvailable = useSchoolSearchStore((state) => state.scholarshipAvailable);
  const atarAvailable = useSchoolSearchStore((state) => state.atarAvailable);
  const elicos = useSchoolSearchStore((state) => state.elicos);
  const toggleState = useSchoolSearchStore((state) => state.toggleState);
  const toggleSector = useSchoolSearchStore((state) => state.toggleSector);
  const toggleSchoolType = useSchoolSearchStore((state) => state.toggleSchoolType);
  const setToggle = useSchoolSearchStore((state) => state.setToggle);
  const toggles = { scholarshipAvailable, atarAvailable, elicos };

  return (
    <>
      <SchoolFilterSection title={t('filterPanel.location')}>
        <div role="group" aria-label={t('filterPanel.state')} className="flex flex-wrap gap-2">
          {STATES.map((state) => (
            <FilterChip key={state} active={states.includes(state)} onClick={() => toggleState(state)}>
              {t(`states.${state}`)}
            </FilterChip>
          ))}
        </div>
      </SchoolFilterSection>
      <SchoolFilterSection title={t('filterPanel.schoolProfile')}>
        <div className="flex flex-col gap-2">
          <h4 className="text-caption font-semibold text-muted-foreground">
            {t('filterPanel.sector')}
          </h4>
          <div role="group" aria-label={t('filterPanel.sector')} className="flex flex-wrap gap-2">
            {SECTORS.map((sector) => (
              <FilterChip
                key={sector}
                active={sectors.includes(sector)}
                onClick={() => toggleSector(sector)}
              >
                {t(`sectors.${SECTOR_LABEL_KEYS[sector]}`)}
              </FilterChip>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-caption font-semibold text-muted-foreground">
            {t('filterPanel.schoolType')}
          </h4>
          <div role="group" aria-label={t('filterPanel.schoolType')} className="flex flex-wrap gap-2">
            {SCHOOL_TYPES.map((type) => (
              <FilterChip
                key={type}
                active={schoolTypes.includes(type)}
                onClick={() => toggleSchoolType(type)}
              >
                {t(`schoolTypes.${type}`)}
              </FilterChip>
            ))}
          </div>
        </div>
      </SchoolFilterSection>
      <SchoolFilterSection title={t('filterPanel.features')}>
        <div className="flex flex-wrap gap-2">
          {TOGGLE_KEYS.map((key) => (
            <FilterChip key={key} active={toggles[key]} onClick={() => setToggle(key, !toggles[key])}>
              {t(`toggles.${key}`)}
            </FilterChip>
          ))}
        </div>
      </SchoolFilterSection>
    </>
  );
}

export { SchoolFilterControls };
