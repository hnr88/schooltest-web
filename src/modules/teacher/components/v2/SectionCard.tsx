import { cn } from '@/lib/utils';
import { DataPanel } from '@/modules/design-system';
import { SECTION_CARD_PADDING } from '@/modules/teacher/constants/teacher-kit.constants';
import type { SectionCardProps } from '@/modules/teacher/types/teacher-kit.types';

/**
 * Teacher Portal v2 — the inner panel every tab body is built from
 * (design-surfaces §8.4 "Card/panel"): #FAFBFC (or white), #ECEEF2 hairline,
 * r11, 24/26 padding; an optional 16px/600 title, a 13px grey description and
 * right-side actions, then the body 18px below. Restyled from the
 * design-system DataPanel (a `<section>`), minus its shadow and clipping.
 */
function SectionCard({
  title,
  description,
  actions,
  tone = 'muted',
  padding = 'lg',
  className,
  children,
  ...rest
}: SectionCardProps) {
  const hasHead = Boolean(title) || Boolean(description) || Boolean(actions);

  return (
    <DataPanel
      data-kit="section-card"
      className={cn(
        'flex min-w-0 flex-col gap-[18px] overflow-visible rounded-[11px] border-[#ECEEF2] shadow-none',
        tone === 'muted' ? 'bg-[#FAFBFC]' : 'bg-white',
        SECTION_CARD_PADDING[padding],
        className,
      )}
      {...rest}
    >
      {hasHead ? (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            {title ? <h2 className="text-[16px] font-semibold text-navy-900">{title}</h2> : null}
            {description ? (
              <p className="mt-[5px] text-[13px] text-[#6B7280]">{description}</p>
            ) : null}
          </div>
          {actions ?? null}
        </div>
      ) : null}
      {children}
    </DataPanel>
  );
}

export { SectionCard };
