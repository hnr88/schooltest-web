'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useDebouncedValue } from '@/modules/dashboard';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/modules/design-system';
import { useSchoolSearchStore } from '@/modules/school-search/stores/use-school-search-store';

const DEBOUNCE_MS = 300;

// §5.4 search field. Keystrokes only touch local state; the store's `setQ`
// (which resets the page) fires solely from the debounced value — fixing the
// legacy undebounced request-per-keystroke bug (C-UI-SEARCH-SCHOOLS).
function SchoolSearchInput() {
  const t = useTranslations('SchoolSearch');
  const setQ = useSchoolSearchStore((s) => s.setQ);
  const [value, setValue] = useState('');
  const debounced = useDebouncedValue(value, DEBOUNCE_MS);

  useEffect(() => {
    setQ(debounced);
  }, [debounced, setQ]);

  return (
    <InputGroup className="max-w-sm">
      <InputGroupAddon>
        <Search aria-hidden="true" className="size-4 text-slate-400" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label={t('searchLabel')}
        placeholder={t('searchPlaceholder')}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    </InputGroup>
  );
}

export { SchoolSearchInput };
