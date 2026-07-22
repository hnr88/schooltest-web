'use client';

import { useTranslations } from 'next-intl';

import {
  FEE_MAX_BOUND,
  FEE_MIN_BOUND,
  SECTOR_LABEL_KEYS,
  TOGGLE_KEYS,
} from '@/modules/school-search/constants/school-search.constants';
import { toFeeThousands } from '@/modules/school-search/lib/fee-range';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';
import type { AppliedFilterChip } from '@/modules/search-shared';

// One removable chip per narrowing the schools corpus is under (spec 01 §8.2). Each
// chip removes exactly its OWN value through the store's whole-selection setters —
// the setters RECONCILIATION 4.4 item 2 pins — so the chip row and the dialog can
// never disagree about what is applied.
export function useSchoolFilterChips(): AppliedFilterChip[] {
  const t = useTranslations('SchoolSearch');
  const states = useSchoolSearchStore((s) => s.states);
  const sectors = useSchoolSearchStore((s) => s.sectors);
  const schoolTypes = useSchoolSearchStore((s) => s.schoolTypes);
  const scholarshipAvailable = useSchoolSearchStore((s) => s.scholarshipAvailable);
  const atarAvailable = useSchoolSearchStore((s) => s.atarAvailable);
  const elicos = useSchoolSearchStore((s) => s.elicos);
  const feeMin = useSchoolSearchStore((s) => s.feeMin);
  const feeMax = useSchoolSearchStore((s) => s.feeMax);
  const setStates = useSchoolSearchStore((s) => s.setStates);
  const setSectors = useSchoolSearchStore((s) => s.setSectors);
  const setSchoolTypes = useSchoolSearchStore((s) => s.setSchoolTypes);
  const setToggles = useSchoolSearchStore((s) => s.setToggles);
  const setFeeRange = useSchoolSearchStore((s) => s.setFeeRange);

  const toggles = { scholarshipAvailable, atarAvailable, elicos };
  const activeToggles = TOGGLE_KEYS.filter((key) => toggles[key]);

  const chips: AppliedFilterChip[] = [
    ...states.map((value) => ({
      key: `state:${value}`,
      label: t(`states.${value}`),
      onRemove: () => setStates(states.filter((entry) => entry !== value)),
    })),
    ...sectors.map((value) => ({
      key: `sector:${value}`,
      label: t(`sectors.${SECTOR_LABEL_KEYS[value]}`),
      onRemove: () => setSectors(sectors.filter((entry) => entry !== value)),
    })),
    ...schoolTypes.map((value) => ({
      key: `type:${value}`,
      label: t(`schoolTypes.${value}`),
      onRemove: () => setSchoolTypes(schoolTypes.filter((entry) => entry !== value)),
    })),
    ...activeToggles.map((value) => ({
      key: `toggle:${value}`,
      label: t(`toggles.${value}`),
      onRemove: () => setToggles(activeToggles.filter((entry) => entry !== value)),
    })),
  ];

  if (feeMin > FEE_MIN_BOUND || feeMax < FEE_MAX_BOUND) {
    chips.push({
      key: 'fee',
      label: t('fee.readout', { min: toFeeThousands(feeMin), max: toFeeThousands(feeMax) }),
      onRemove: () => setFeeRange(FEE_MIN_BOUND, FEE_MAX_BOUND),
    });
  }

  return chips;
}
