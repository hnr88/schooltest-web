import { cn } from '@/lib/utils';

import type { SparklineProps } from '@/modules/design-system/types/record.types';

// Canonical Sparkline (§07): a 200x52 viewBox stretched to the container
// (preserveAspectRatio="none"), #EFF5FF area under a 2.5px #2563EB round-capped line.
// Two points are the minimum that draws a trend; below that the component renders
// nothing rather than a flat line implying data it does not have.
const WIDTH = 200;
const HEIGHT = 52;

function Sparkline({ points, ariaLabel, className }: SparklineProps) {
  if (points.length < 2) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const step = WIDTH / (points.length - 1);
  const coords = points.map((point, index) => {
    const x = index * step;
    const y = HEIGHT - ((point - min) / span) * (HEIGHT - 6) - 3;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return (
    <svg
      data-slot="sparkline"
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className={cn('h-13 w-full', className)}
    >
      <polygon
        points={`0,${HEIGHT} ${coords.join(' ')} ${WIDTH},${HEIGHT}`}
        className="fill-blue-50"
      />
      <polyline
        points={coords.join(' ')}
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="stroke-primary"
      />
    </svg>
  );
}

export { Sparkline };
