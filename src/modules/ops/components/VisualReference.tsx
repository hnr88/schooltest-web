'use client';

import { useVisualReference } from '@/modules/ops/hooks/use-visual-reference';
import { cn } from '@/lib/utils';

interface VisualReferenceProps {
  /** Path the harness serves the unmodified reference HTML from. */
  src: string;
  /** Which of the reference's nine scenarios to show. */
  scenario?: string;
  isMobile?: boolean;
  className?: string;
}

/**
 * OPS-010 — renders the untouched Ops Portal reference beside the real
 * implementation so a difference can be looked at rather than argued about.
 *
 * It is a REFERENCE surface: it frames the original HTML in an isolated iframe
 * and never calls a production mutation. The iframe is sandboxed without
 * allow-same-origin, so reference JS cannot reach this app's storage or session.
 */
export function VisualReference({
  src,
  scenario = 'happy',
  isMobile = false,
  className = '',
}: VisualReferenceProps) {
  const reference = useVisualReference();
  const { width, height } = isMobile ? reference.mobileViewport : reference.viewport;

  return (
    <figure className={cn('flex flex-col gap-2', className)}>
      <iframe
        title={`Ops Portal reference — ${scenario}`}
        src={`${src}#scenario=${scenario}`}
        width={width}
        height={height}
        sandbox="allow-scripts"
        loading="lazy"
        className="border-border bg-background rounded-lg border"
      />
      <figcaption className="text-muted-foreground text-xs">
        Reference {width}&times;{height} @{reference.deviceScaleFactor}x, clock frozen at{' '}
        {reference.clockIso}, sha256 {reference.htmlSha256.slice(0, 12)}…
        {reference.unresolvedPhotos.length > 0 && (
          <span className="text-destructive">
            {' '}
            — {reference.unresolvedPhotos.length} reference photos unresolved; pixel parity
            cannot be signed off where they appear.
          </span>
        )}
      </figcaption>
    </figure>
  );
}
