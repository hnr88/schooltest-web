import type { SchoolSectionScreenProps } from '@/modules/school-admin/types/components.types';

// Thin school-admin section page (classes / children / teachers): the VIEW
// header (School Admin Portal.dc.html:213-214 — 30px/500 title, 14px muted
// summary, 20px rhythm) plus an honest empty state on the design's plain
// white card. The real lists land in tasks 29/30/23/31 — this component only
// carries the shell and copy, fed by the server page via props.
export function SchoolSectionScreen({
  surface,
  title,
  description,
  emptyTitle,
  emptyDescription,
}: SchoolSectionScreenProps) {
  return (
    <main
      data-slot="school-section"
      data-surface={surface}
      className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div>
        <h1 className="text-portal-title font-medium text-foreground">{title}</h1>
        <p className="mt-1.75 text-body-md text-muted-foreground">{description}</p>
      </div>
      <div className="rounded-card bg-card px-7.5 py-14 text-center shadow-sm">
        <p className="text-base font-semibold text-foreground">{emptyTitle}</p>
        <p className="mx-auto mt-1.5 max-w-md text-body-sm text-muted-foreground">
          {emptyDescription}
        </p>
      </div>
    </main>
  );
}
