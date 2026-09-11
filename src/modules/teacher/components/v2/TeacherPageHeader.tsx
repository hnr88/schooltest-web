import { cn } from '@/lib/utils';
import type { TeacherPageHeaderProps } from '@/modules/teacher/types/teacher-kit.types';

/**
 * Teacher Portal v2 — the list-page header row (`Teacher Portal
 * v2.dc.html:60–71`, `:221–229`): h1 24px/600 −0.025em navy, a 13.5px grey
 * subtitle 8px below, and on the right the 13px meta text followed by the
 * actions. Bottom-aligned, wraps under 32px gutters.
 */
function TeacherPageHeader({ title, subtitle, meta, actions, className }: TeacherPageHeaderProps) {
  const hasMeta = meta !== undefined && meta !== null && meta !== '';
  const hasAside = hasMeta || (actions !== undefined && actions !== null);

  return (
    <div
      data-slot="teacher-page-header"
      className={cn(
        'flex flex-wrap items-end justify-between gap-6 px-8 pt-[30px] pb-6',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="m-0 text-[24px] leading-[normal] font-semibold tracking-[-0.025em] text-navy-900">
          {title}
        </h1>
        {subtitle ? <p className="mt-2 text-[13.5px] text-[#6B7280]">{subtitle}</p> : null}
      </div>
      {hasAside ? (
        <div className="flex flex-wrap items-center gap-4">
          {hasMeta ? (
            <span data-slot="teacher-page-meta" className="text-[13px] text-[#6B7280]">
              {meta}
            </span>
          ) : null}
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export { TeacherPageHeader };
