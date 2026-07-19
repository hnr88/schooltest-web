'use client';

import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { InputGroup, InputGroupAddon, InputGroupInput } from '@/modules/design-system';
import { useUnifiedSearchField } from '@/modules/unified-search/hooks/use-unified-search-field';
import type { UnifiedSearchMode } from '@/modules/unified-search/types/unified-search.types';

// C-UI-SEARCH-UNIFIED §5.4: the single mode-aware search bar that REPLACES each
// pane's private input. Its displayed value REFLECTS the active pane store's `q`
// (bound via `useUnifiedSearchField`), so an empty-state "Reset filters" / filter
// Reset-all that sets q:'' instantly clears the field — the W6 reset-desync fix.
// Plain debounced text input — no typeahead dropdown / suggestion list (D-SCOPE-1).
function UnifiedSearchBar({ mode }: { mode: UnifiedSearchMode }) {
  const t = useTranslations('UnifiedSearch');
  const { value, setValue, clear, hasValue } = useUnifiedSearchField(mode);
  const placeholder =
    mode === 'schools' ? t('searchPlaceholderSchools') : t('searchPlaceholderAgents');

  return (
    <InputGroup className="max-w-sm bg-background duration-300 ease-out animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
      <InputGroupAddon>
        <Search aria-hidden="true" className="size-4 text-slate-400" />
      </InputGroupAddon>
      <InputGroupInput
        type="text"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      {hasValue ? (
        <InputGroupAddon align="inline-end">
          <button
            type="button"
            onClick={clear}
            aria-label={t('clearSearch')}
            className="flex size-5 items-center justify-center rounded-full text-slate-400 outline-none transition duration-150 ease-out animate-in fade-in zoom-in-95 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:scale-95 motion-reduce:animate-none motion-reduce:transition-none"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}

export { UnifiedSearchBar };
