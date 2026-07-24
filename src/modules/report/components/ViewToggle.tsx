'use client';

import { useTranslations } from 'next-intl';

import { SegmentedControl } from '@/modules/design-system';
import type { ReportViewMode } from '@/modules/report/types/report-view.types';

const MODES: readonly ReportViewMode[] = ['teacher', 'parent'];

function isMode(value: string): value is ReportViewMode {
  return MODES.some((mode) => mode === value);
}

// E11-10 — the audience switch. It swaps what this ONE result renders as; it
// issues no request, changes no query key and navigates nowhere, so the two
// modes are always the same C-4 read of the same row.
export function ViewToggle({
  value,
  onChange,
}: {
  value: ReportViewMode;
  onChange: (mode: ReportViewMode) => void;
}) {
  const t = useTranslations('Report');

  return (
    <div
      data-slot="report-view-toggle"
      data-view={value}
      className="flex animate-in flex-wrap items-center gap-x-4 gap-y-2 duration-300 ease-out-expo fade-in slide-in-from-bottom-2 motion-reduce:animate-none"
    >
      <SegmentedControl
        ariaLabel={t('viewToggleLabel')}
        value={value}
        onValueChange={(next) => {
          if (isMode(next)) onChange(next);
        }}
        options={MODES.map((mode) => ({ value: mode, label: t(`viewModes.${mode}`) }))}
      />
      <p data-slot="report-view-hint" className="text-caption text-muted-foreground">
        {t(`viewModeHint.${value}`)}
      </p>
    </div>
  );
}
