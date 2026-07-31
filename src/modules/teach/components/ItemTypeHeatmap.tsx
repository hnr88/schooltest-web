'use client';

import { useTranslations } from 'next-intl';

import {
  groupBySection,
  HEATMAP_CHANCE_FLOOR,
  HEATMAP_SECURE_CUT,
} from '@/modules/teach/lib/heatmap-view-model';
import { HeatmapCell } from '@/modules/teach/components/HeatmapCell';
import type { DiagnosticHeatmapRow } from '@/modules/teach/types/diagnostic.types';

interface ItemTypeHeatmapProps {
  rows: DiagnosticHeatmapRow[];
}

// The class item-type heat map (task 75, mvp-updates §4.9): a grid of cells
// keyed by item code + section only, nested under the mastery view as the
// evidence underneath it. Never attribute names, never a score — items
// correct / responses, colour-coded green / orange / red against the chance
// floor.
export function ItemTypeHeatmap({ rows }: ItemTypeHeatmapProps) {
  const t = useTranslations('Teach.diagnostic');
  const sections = [...groupBySection(rows).entries()];
  const floorPct = Math.round(HEATMAP_CHANCE_FLOOR * 100);
  const securePct = Math.round(HEATMAP_SECURE_CUT * 100);

  return (
    <div data-slot="item-type-heatmap" className="flex flex-col gap-4">
      <p className="max-w-xl text-xs text-muted-foreground">
        {t('heatmapLegend', { floor: floorPct, secure: securePct })}
      </p>
      {sections.map(([section, cells]) => (
        <section key={section} className="flex flex-col gap-2" aria-label={t('sectionHeading', { section })}>
          <h4 className="text-sm font-semibold text-foreground">
            {t('sectionHeading', { section })}
          </h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {cells.map((cell) => (
              <HeatmapCell key={`${cell.item_code}-${cell.section}`} row={cell} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
