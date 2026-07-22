'use client';

import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useUnifiedSearchField } from '@/modules/unified-search/hooks/use-unified-search-field';
import type { UnifiedSearchMode } from '@/modules/unified-search/types/unified-search.types';

// The design's search PILL (spec 01 §8.1): a 48px white capsule, 20px inset
// magnifier, a borderless 14px field and a navy "Search" button sitting inside the
// right edge. Hand-built rather than wrapped around InputGroup because the pill IS
// the geometry — a 999px capsule with a button inside it is not a variant of the
// canonical bordered input box.
// The field still REFLECTS the active pane store's `q` (bound via
// `useUnifiedSearchField`), so an empty-state "Reset filters" or a filter Reset-all
// that sets q:'' instantly clears it — the W6 reset-desync fix. The design sets
// `outline:none` on this input and replaces it with nothing, so the pill draws its
// own focus ring from --ring whenever anything inside it is focused.
// Plain debounced text input — no typeahead dropdown / suggestion list (D-SCOPE-1).
function UnifiedSearchBar({ mode }: { mode: UnifiedSearchMode }) {
  const t = useTranslations('UnifiedSearch');
  const { value, setValue, clear, commit, hasValue } = useUnifiedSearchField(mode);
  const placeholder =
    mode === 'schools' ? t('searchPlaceholderSchools') : t('searchPlaceholderAgents');

  return (
    <div
      data-slot="unified-search-pill"
      className="flex h-12 w-full min-w-0 items-center gap-2.5 rounded-full bg-card pr-2 pl-5 shadow-sm transition duration-200 ease-out-expo animate-in fade-in slide-in-from-bottom-1 focus-within:ring-2 focus-within:ring-ring hover:shadow-md sm:w-90 motion-reduce:animate-none motion-reduce:transition-none"
    >
      <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      <input
        type="text"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
        }}
        className="min-w-0 flex-1 border-none bg-transparent text-body-md text-foreground outline-none placeholder:text-muted-foreground"
      />
      {hasValue ? (
        <button
          type="button"
          onClick={clear}
          aria-label={t('clearSearch')}
          className="grid size-6 shrink-0 place-items-center rounded-full text-slate-400 transition duration-200 ease-out-expo animate-in fade-in zoom-in-95 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-90 motion-reduce:animate-none motion-reduce:transition-none"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={commit}
        className="h-9 shrink-0 rounded-full bg-navy-900 px-4.5 text-caption font-semibold text-primary-foreground transition duration-200 ease-out-expo hover:bg-navy-800 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        {t('searchAction')}
      </button>
    </div>
  );
}

export { UnifiedSearchBar };
