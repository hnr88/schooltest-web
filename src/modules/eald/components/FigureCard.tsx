import { cn } from '@/lib/utils';

import { DataPanel, PanelHeaderRow } from '@/modules/design-system';

import type { FigureCardProps } from '@/modules/eald/types/components.types';

function FigureCard({ title, context, footnote, children, className }: FigureCardProps) {
  return (
    <DataPanel className={cn('min-w-0', className)}>
      <figure data-slot="figure-card" className="min-w-0">
        <figcaption
          data-slot="figure-card-caption"
          className="border-b border-border bg-muted/50 px-6 py-4.5"
        >
          <PanelHeaderRow
            title={title}
            as="span"
            action={
              context ? (
                <span className="text-meta text-muted-foreground">{context}</span>
              ) : undefined
            }
            className="flex-wrap items-baseline gap-x-5 gap-y-1 pb-0"
          />
        </figcaption>
        <div data-slot="figure-card-body" className="overflow-x-auto px-6 pt-5.5 pb-2">
          {children}
        </div>
        {footnote ? (
          <p
            data-slot="figure-card-footnote"
            className="border-t border-border px-6 py-3.5 text-meta text-muted-foreground"
          >
            {footnote}
          </p>
        ) : null}
      </figure>
    </DataPanel>
  );
}

export { FigureCard };
