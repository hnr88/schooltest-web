'use client';

import { useTranslations } from 'next-intl';

import {
  AGENT_SERVICES,
  COUNTRY_CHIPS,
  LANGUAGE_CHIPS,
} from '@/modules/agent-search/constants/agent-search.constants';
import { useAgentSearchStore } from '@/modules/agent-search/stores/use-agent-search-store';
import { ChoicePillGroup, FilterRailSection } from '@/modules/design-system';

// Same three canonical objects as the schools rail — FilterRailSection + a single
// multi-select ChoicePillGroup per group — so both panes of one page are one system.
function AgentFilterControls() {
  const t = useTranslations('AgentSearch');
  const countriesServed = useAgentSearchStore((state) => state.countriesServed);
  const languages = useAgentSearchStore((state) => state.languages);
  const services = useAgentSearchStore((state) => state.services);
  const setCountries = useAgentSearchStore((state) => state.setCountries);
  const setLanguages = useAgentSearchStore((state) => state.setLanguages);
  const setServices = useAgentSearchStore((state) => state.setServices);

  return (
    <>
      <FilterRailSection title={t('filterPanel.countries')}>
        <ChoicePillGroup
          mode="multiple"
          size="md"
          className="gap-x-2.5 gap-y-5"
          ariaLabel={t('filterPanel.countries')}
          options={COUNTRY_CHIPS.map((country) => ({ value: country, label: country }))}
          value={countriesServed}
          onValueChange={setCountries}
        />
      </FilterRailSection>
      <FilterRailSection title={t('filterPanel.languages')}>
        <ChoicePillGroup
          mode="multiple"
          size="md"
          className="gap-x-2.5 gap-y-5"
          ariaLabel={t('filterPanel.languages')}
          options={LANGUAGE_CHIPS.map((language) => ({ value: language, label: language }))}
          value={languages}
          onValueChange={setLanguages}
        />
      </FilterRailSection>
      <FilterRailSection title={t('filterPanel.services')}>
        <ChoicePillGroup
          mode="multiple"
          size="md"
          className="gap-x-2.5 gap-y-5"
          ariaLabel={t('filterPanel.services')}
          options={AGENT_SERVICES.map((service) => ({
            value: service,
            label: t(`services.${service}`),
          }))}
          value={services}
          onValueChange={setServices}
        />
      </FilterRailSection>
    </>
  );
}

export { AgentFilterControls };
