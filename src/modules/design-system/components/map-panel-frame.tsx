import { cn } from '@/lib/utils';

import type { MapPanelFrameProps } from '@/modules/design-system/types/media.types';

// The frame a map (or any full-bleed embed) sits in, so the embed never has to own
// the surface treatment. Same Panel box as every other app surface — r16, 1px
// #E3E8F0, shadow-sm, `overflow:hidden` — which is what clips a raster tile layer
// to the rounded corner.
// Height comes from `rail-viewport`, NOT `h-screen`: the audit measured a 900px map
// inside an 836px scrollport, so the bottom 64px of every map was unreachable.
// `role="region"` + the required `label` give the embed an accessible name; a bare
// <div> full of tiles announces nothing.
function MapPanelFrame({
  label,
  children,
  overlay,
  footer,
  sticky = true,
  className,
}: MapPanelFrameProps) {
  return (
    <section
      role="region"
      aria-label={label}
      data-slot="map-panel-frame"
      className={cn(
        'relative flex min-h-0 flex-col overflow-hidden rounded-panel border border-border bg-card shadow-sm',
        sticky && 'lg:sticky lg:top-6 lg:rail-viewport',
        className,
      )}
    >
      <div className="relative min-h-0 flex-1 [&_.leaflet-container]:size-full">{children}</div>
      {overlay ? (
        <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2">
          <div className="pointer-events-auto flex flex-wrap gap-2">{overlay}</div>
        </div>
      ) : null}
      {footer ? (
        <div className="shrink-0 border-t border-border bg-card px-4 py-3 text-meta text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

export { MapPanelFrame };
