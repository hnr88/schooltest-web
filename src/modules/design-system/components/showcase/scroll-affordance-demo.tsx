import { getTranslations } from 'next-intl/server';

import { KeyValueList, KeyValueRow } from '@/modules/design-system/components/key-value-row';
import { PanelHeaderRow } from '@/modules/design-system/components/panel-header-row';
import { TintTile } from '@/modules/design-system/components/tint-tile';

// The three scroll utilities, rendered so a reviewer can see the bar rather than
// read about it. `scroll-region-x` / `scroll-region` are the full recipe (min-size 0,
// contained overscroll, stable gutter, thin bar); `scrollbar-thin` is the bar alone,
// for a region that already owns its own overflow.
const MONTH_KEYS = [
  'recordMonthMar',
  'recordMonthApr',
  'recordMonthMay',
  'recordMonthJun',
  'recordMonthJul',
] as const;

const FACT_KEYS = [
  ['recordYearLevel', 'recordYearLevelValue'],
  ['recordNationality', 'recordNationalityValue'],
  ['recordTargetEntry', 'recordTargetEntryValue'],
  ['recordGlassCorrect', 'recordGlassCorrectValue'],
  ['recordGlassBand', 'recordGlassBandValue'],
] as const;

async function ScrollAffordanceDemo() {
  const t = await getTranslations('DesignSystem');
  // `min-w-0` on the GRID ITEM is what actually lets the strip below scroll: a grid
  // child defaults to min-width:auto and would otherwise push the PAGE sideways
  // instead of letting its own overflow region take the excess.
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-panel border border-border bg-card p-5.5 shadow-sm">
      <PanelHeaderRow title={t('recordScrollTitle')} description={t('recordScrollBody')} />
      {/* A scroll region whose CONTENT is not focusable must be focusable itself, or a
          keyboard user cannot reach the overflow at all (axe:
          scrollable-region-focusable). The rail body needs no tabindex because its
          filter chips already take focus. */}
      <div
        role="group"
        tabIndex={0}
        aria-label={t('recordScrollTitle')}
        className="flex scroll-region-x gap-3 pb-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {MONTH_KEYS.map((key) => (
          <TintTile key={key} className="w-44 shrink-0 text-caption font-semibold">
            {t(key)}
          </TintTile>
        ))}
      </div>
      <div
        role="group"
        tabIndex={0}
        aria-label={t('recordEnrolmentTitle')}
        className="scrollbar-thin max-h-28 overflow-y-auto overscroll-contain pr-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <KeyValueList>
          {FACT_KEYS.map(([label, value]) => (
            <KeyValueRow key={label} label={t(label)}>
              {t(value)}
            </KeyValueRow>
          ))}
        </KeyValueList>
      </div>
    </section>
  );
}

export { ScrollAffordanceDemo };
