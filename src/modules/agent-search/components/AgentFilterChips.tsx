'use client';

import { useTranslations } from 'next-intl';

import { AgentSortChip } from '@/modules/agent-search/components/AgentSortChip';
import {
  AGENT_SERVICES,
  COUNTRY_CHIPS,
  LANGUAGE_CHIPS,
} from '@/modules/agent-search/constants/agent-search.constants';
import { useAgentSearchStore } from '@/modules/agent-search/stores/use-agent-search-store';
import { SearchFilterChip } from '@/modules/search-shared';

// §13.1 chip row: country / language / service toggle groups (bound to the 036
// store) + the sort dropdown chip. Individual selectors avoid whole-store churn.
function AgentFilterChips() {
  const t = useTranslations('AgentSearch');
  const countriesServed = useAgentSearchStore((s) => s.countriesServed);
  const languages = useAgentSearchStore((s) => s.languages);
  const services = useAgentSearchStore((s) => s.services);
  const toggleCountry = useAgentSearchStore((s) => s.toggleCountry);
  const toggleLanguage = useAgentSearchStore((s) => s.toggleLanguage);
  const toggleService = useAgentSearchStore((s) => s.toggleService);

  return (
    <div
      role="group"
      aria-label={t('aria.filters')}
      className="flex flex-wrap items-center gap-2.5 duration-300 ease-out animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none"
    >
      <div role="group" aria-label={t('chipGroups.countries')} className="flex flex-wrap gap-2.5">
        {COUNTRY_CHIPS.map((country) => (
          <SearchFilterChip
            key={country}
            active={countriesServed.includes(country)}
            onClick={() => toggleCountry(country)}
          >
            {country}
          </SearchFilterChip>
        ))}
      </div>
      <div role="group" aria-label={t('chipGroups.languages')} className="flex flex-wrap gap-2.5">
        {LANGUAGE_CHIPS.map((language) => (
          <SearchFilterChip
            key={language}
            active={languages.includes(language)}
            onClick={() => toggleLanguage(language)}
          >
            {language}
          </SearchFilterChip>
        ))}
      </div>
      <div role="group" aria-label={t('chipGroups.services')} className="flex flex-wrap gap-2.5">
        {AGENT_SERVICES.map((service) => (
          <SearchFilterChip
            key={service}
            active={services.includes(service)}
            onClick={() => toggleService(service)}
          >
            {t(`services.${service}`)}
          </SearchFilterChip>
        ))}
      </div>
      <AgentSortChip />
    </div>
  );
}

export { AgentFilterChips };
