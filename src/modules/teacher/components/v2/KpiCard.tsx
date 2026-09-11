import { cn } from '@/lib/utils';
import { KPI_TONES, KPI_VARIANTS } from '@/modules/teacher/constants/teacher-kit.constants';
import type { KpiCardProps } from '@/modules/teacher/types/teacher-kit.types';

/**
 * Teacher Portal v2 — the #FAFBFC stat tile (r11, #ECEEF2 hairline):
 * - `insight`: 12px caps label, 28px/400 value, sub (Teaching insights KPIs, `:734–742`);
 * - `progress`: 11.5px label, 26px value in its tone, sub (Class progress tiles, `:880–888`);
 * - `count`: 30px value FIRST, then a 12.5px label (Family reports tiles, `:1305–1312`).
 * The design-system MiniStatTile/MetricCard carry icons and a bold scale the
 * design does not draw, so this is its own tile.
 */
function KpiCard({ label, value, sub, variant = 'insight', tone = 'navy', className }: KpiCardProps) {
  const skin = KPI_VARIANTS[variant];
  const valueNode = <div className={cn(skin.value, KPI_TONES[tone])}>{value}</div>;

  return (
    <div
      data-slot="kpi-card"
      data-variant={variant}
      className={cn('min-w-0 rounded-[11px] border border-[#ECEEF2] bg-[#FAFBFC]', skin.root, className)}
    >
      {variant === 'count' ? (
        <>
          {valueNode}
          <div className={skin.label}>{label}</div>
        </>
      ) : (
        <>
          <div className={skin.label}>{label}</div>
          {valueNode}
        </>
      )}
      {sub ? <div className={skin.sub}>{sub}</div> : null}
    </div>
  );
}

export { KpiCard };
