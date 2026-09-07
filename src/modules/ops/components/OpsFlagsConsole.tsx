'use client';

import { useTranslations } from 'next-intl';

import { OpsBannerEditor } from './OpsBannerEditor';
import { OpsFlagsRegistry } from './OpsFlagsRegistry';
import { OpsRateLimitEditor } from './OpsRateLimitEditor';

// C-OPSF-01..05 (ledger 9) — the ops Flags console.
//
// Registry first, then the three settings editors, ordered by blast radius:
// the flags are reversible booleans, the announcement speaks to visitors,
// maintenance closes the site, and the rate limit governs sign-in itself.
//
// Each piece owns its own loading and error state; the two banner editors are
// one configurable component (see OpsBannerEditor) and the rate-limit editor is
// deliberately separate because it is a different interaction.
export function OpsFlagsConsole() {
  const t = useTranslations('Ops.flags');

  return (
    <div data-slot="ops-flags-console" className="flex flex-col gap-8">
      <OpsFlagsRegistry />
      <section data-slot="ops-flags-editors" className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-foreground">{t('editorsTitle')}</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <OpsBannerEditor variant="announcement" />
          <OpsBannerEditor variant="maintenance" />
        </div>
        <OpsRateLimitEditor />
      </section>
    </div>
  );
}
