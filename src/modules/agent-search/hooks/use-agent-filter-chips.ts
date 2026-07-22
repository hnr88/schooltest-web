'use client';

import { useTranslations } from 'next-intl';

import { useAgentSearchStore } from '@/modules/agent-search/stores/use-agent-search-store';
import type { AppliedFilterChip } from '@/modules/search-shared';

// One removable chip per narrowing the agents corpus is under, mirroring the schools
// pane. Removal goes through the whole-selection setters RECONCILIATION 4.4 item 1
// pins, so the chip row and the filters overlay can never disagree.
export function useAgentFilterChips(): AppliedFilterChip[] {
  const t = useTranslations('AgentSearch');
  const countriesServed = useAgentSearchStore((s) => s.countriesServed);
  const languages = useAgentSearchStore((s) => s.languages);
  const services = useAgentSearchStore((s) => s.services);
  const setCountries = useAgentSearchStore((s) => s.setCountries);
  const setLanguages = useAgentSearchStore((s) => s.setLanguages);
  const setServices = useAgentSearchStore((s) => s.setServices);

  return [
    ...countriesServed.map((value) => ({
      key: `country:${value}`,
      label: value,
      onRemove: () => setCountries(countriesServed.filter((entry) => entry !== value)),
    })),
    ...languages.map((value) => ({
      key: `language:${value}`,
      label: value,
      onRemove: () => setLanguages(languages.filter((entry) => entry !== value)),
    })),
    ...services.map((value) => ({
      key: `service:${value}`,
      label: t(`services.${value}`),
      onRemove: () => setServices(services.filter((entry) => entry !== value)),
    })),
  ];
}
