'use client';

import { useTranslations } from 'next-intl';

import { ChoicePillGroup, FilterRailSection } from '@/modules/design-system';
import { SchoolFeeRangeFilter } from '@/modules/school-search/components/SchoolFeeRangeFilter';
import {
  SCHOOL_TYPES,
  SECTOR_LABEL_KEYS,
  SECTORS,
  STATES,
  TOGGLE_KEYS,
} from '@/modules/school-search/constants/school-search.constants';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';

// Every group is a canonical FilterRailSection (11px/700/.08em label over a #EEF2F7
// divider) filled with ONE ChoicePillGroup in `multiple` mode — the canonical
// multi-select control. That replaces the 17 hand-rolled FilterChips the audit
// counted and brings the 44px pointer box and aria-pressed contract with it.
function SchoolFilterControls() {
  const t = useTranslations('SchoolSearch');
  const states = useSchoolSearchStore((state) => state.states);
  const sectors = useSchoolSearchStore((state) => state.sectors);
  const schoolTypes = useSchoolSearchStore((state) => state.schoolTypes);
  const scholarshipAvailable = useSchoolSearchStore((state) => state.scholarshipAvailable);
  const atarAvailable = useSchoolSearchStore((state) => state.atarAvailable);
  const elicos = useSchoolSearchStore((state) => state.elicos);
  const setStates = useSchoolSearchStore((state) => state.setStates);
  const setSectors = useSchoolSearchStore((state) => state.setSectors);
  const setSchoolTypes = useSchoolSearchStore((state) => state.setSchoolTypes);
  const setToggles = useSchoolSearchStore((state) => state.setToggles);
  const toggles = { scholarshipAvailable, atarAvailable, elicos };

  return (
    <>
      <FilterRailSection title={t('filterPanel.location')}>
        <ChoicePillGroup
          mode="multiple"
          size="md"
          className="gap-x-2.5 gap-y-5"
          ariaLabel={t('filterPanel.state')}
          options={STATES.map((state) => ({ value: state, label: t(`states.${state}`) }))}
          value={states}
          onValueChange={setStates}
        />
      </FilterRailSection>
      <FilterRailSection title={t('filterPanel.schoolProfile')}>
        <div className="flex flex-col gap-4">
          <ChoicePillGroup
            mode="multiple"
            size="md"
            className="gap-x-2.5 gap-y-5"
            ariaLabel={t('filterPanel.sector')}
            options={SECTORS.map((sector) => ({
              value: sector,
              label: t(`sectors.${SECTOR_LABEL_KEYS[sector]}`),
            }))}
            value={sectors}
            onValueChange={setSectors}
          />
          <ChoicePillGroup
            mode="multiple"
            size="md"
            className="gap-x-2.5 gap-y-5"
            ariaLabel={t('filterPanel.schoolType')}
            options={SCHOOL_TYPES.map((type) => ({ value: type, label: t(`schoolTypes.${type}`) }))}
            value={schoolTypes}
            onValueChange={setSchoolTypes}
          />
        </div>
      </FilterRailSection>
      <FilterRailSection title={t('filterPanel.features')}>
        <ChoicePillGroup
          mode="multiple"
          size="md"
          className="gap-x-2.5 gap-y-5"
          ariaLabel={t('filterPanel.features')}
          options={TOGGLE_KEYS.map((key) => ({ value: key, label: t(`toggles.${key}`) }))}
          value={TOGGLE_KEYS.filter((key) => toggles[key])}
          onValueChange={setToggles}
        />
      </FilterRailSection>
      <SchoolFeeRangeFilter />
    </>
  );
}

export { SchoolFilterControls };
