import { cn } from '@/lib/utils';
import {
  formatHeatmapValue,
  HEATMAP_TONE_CLASSES,
  heatmapTone,
} from '@/modules/teach/lib/heatmap-view-model';
import type { DiagnosticHeatmapRow } from '@/modules/teach/types/diagnostic.types';

interface HeatmapCellProps {
  row: DiagnosticHeatmapRow;
}

// One heat-map cell (task 75, mvp-updates §4.9): labelled by item code only,
// valued as items correct / responses with the percentage beside it, colour
// bucketed against the chance floor. A bordered tile inside a grid — visibly
// different from the mastery list, so it never reads as a rival grade.
export function HeatmapCell({ row }: HeatmapCellProps) {
  const tone = heatmapTone(row.fraction);
  return (
    <div
      data-slot="heatmap-cell"
      data-tone={tone}
      className={cn(
        'flex flex-col gap-1 rounded-lg border px-3 py-2',
        HEATMAP_TONE_CLASSES[tone],
      )}
    >
      <span className="text-sm font-bold">{row.item_code}</span>
      <span className="text-xs font-medium">
        {formatHeatmapValue(row.correct, row.responses, row.fraction)}
      </span>
    </div>
  );
}
