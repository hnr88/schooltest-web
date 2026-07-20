'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button, Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/modules/design-system';
import { AgentFilterSection } from '@/modules/agent-search/components/AgentFilterSection';
import {
  AGENT_SERVICES,
  COUNTRY_CHIPS,
  LANGUAGE_CHIPS,
} from '@/modules/agent-search/constants/agent-search.constants';
import { useAgentSearchStore } from '@/modules/agent-search/stores/use-agent-search-store';
import { SearchFilterChip } from '@/modules/search-shared';

function AgentFilterPanel() {
  const t = useTranslations('AgentSearch');
  const countriesServed = useAgentSearchStore((state) => state.countriesServed);
  const languages = useAgentSearchStore((state) => state.languages);
  const services = useAgentSearchStore((state) => state.services);
  const toggleCountry = useAgentSearchStore((state) => state.toggleCountry);
  const toggleLanguage = useAgentSearchStore((state) => state.toggleLanguage);
  const toggleService = useAgentSearchStore((state) => state.toggleService);
  const clearFilters = useAgentSearchStore((state) => state.clearFilters);
  const selectedCount = countriesServed.length + languages.length + services.length;
  const selectedChipClass = (active: boolean) =>
    active ? 'bg-navy-950 text-white hover:bg-navy-900' : undefined;

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" className="gap-2" />}>
        <SlidersHorizontal aria-hidden="true" className="size-4" />
        {t('filterPanel.trigger')}
        {selectedCount > 0 ? <span aria-hidden="true">{selectedCount}</span> : null}
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-96 w-80 gap-4 overflow-y-auto p-4">
        <div className="flex items-center justify-between gap-3">
          <PopoverTitle>{t('filterPanel.title')}</PopoverTitle>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            {t('filterPanel.clear')}
          </Button>
        </div>
        <AgentFilterSection title={t('filterPanel.countries')}>
          <div role="group" aria-label={t('filterPanel.countries')} className="flex flex-wrap gap-2">
            {COUNTRY_CHIPS.map((country) => (
              <SearchFilterChip
                key={country}
                active={countriesServed.includes(country)}
                className={selectedChipClass(countriesServed.includes(country))}
                onClick={() => toggleCountry(country)}
              >
                {country}
              </SearchFilterChip>
            ))}
          </div>
        </AgentFilterSection>
        <AgentFilterSection title={t('filterPanel.languages')}>
          <div role="group" aria-label={t('filterPanel.languages')} className="flex flex-wrap gap-2">
            {LANGUAGE_CHIPS.map((language) => (
              <SearchFilterChip
                key={language}
                active={languages.includes(language)}
                className={selectedChipClass(languages.includes(language))}
                onClick={() => toggleLanguage(language)}
              >
                {language}
              </SearchFilterChip>
            ))}
          </div>
        </AgentFilterSection>
        <AgentFilterSection title={t('filterPanel.services')}>
          <div role="group" aria-label={t('filterPanel.services')} className="flex flex-wrap gap-2">
            {AGENT_SERVICES.map((service) => (
              <SearchFilterChip
                key={service}
                active={services.includes(service)}
                className={selectedChipClass(services.includes(service))}
                onClick={() => toggleService(service)}
              >
                {t(`services.${service}`)}
              </SearchFilterChip>
            ))}
          </div>
        </AgentFilterSection>
      </PopoverContent>
    </Popover>
  );
}

export { AgentFilterPanel };
