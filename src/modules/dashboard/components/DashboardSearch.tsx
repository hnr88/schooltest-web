'use client';

import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  DASHBOARD_SEARCH_LISTBOX_ID,
  DashboardSearchResults,
  dashboardSearchOptionId,
} from '@/modules/dashboard/components/DashboardSearchResults';
import { useDashboardSearch } from '@/modules/dashboard/hooks/use-dashboard-search';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/modules/design-system';

// Dashboard header search bar (task 18, D8): debounced C-STUDENT-SEARCH lookup
// with a keyboard-navigable results panel. Selecting a row filters
// StudentsSection's table via the shared dashboard-search store; clearing
// resets both the query and the filter together.
export function DashboardSearch() {
  const t = useTranslations('Dashboard');
  const {
    query,
    isOpen,
    activeIndex,
    results,
    isLoading,
    isError,
    handleFocus,
    handleBlur,
    handleChange,
    handleClear,
    handleSelect,
    handleKeyDown,
  } = useDashboardSearch();

  return (
    <div data-slot="dashboard-search" className="relative w-full max-w-sm">
      <InputGroup>
        <InputGroupAddon>
          <Search aria-hidden="true" className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          role="combobox"
          aria-label={t('searchPlaceholder')}
          aria-expanded={isOpen}
          aria-controls={DASHBOARD_SEARCH_LISTBOX_ID}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? dashboardSearchOptionId(activeIndex) : undefined
          }
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
        {query ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              aria-label={t('clearSearch')}
              onMouseDown={(event) => event.preventDefault()}
              onClick={handleClear}
            >
              <X aria-hidden="true" className="size-4" />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>

      {isOpen ? (
        <DashboardSearchResults
          isLoading={isLoading}
          isError={isError}
          results={results}
          activeIndex={activeIndex}
          onSelect={handleSelect}
        />
      ) : null}
    </div>
  );
}
