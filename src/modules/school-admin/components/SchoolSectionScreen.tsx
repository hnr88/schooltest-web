interface SchoolSectionScreenProps {
  surface: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
}

// Thin school-admin section page (classes / children / teachers): header plus
// an honest empty state. The real lists land in tasks 29/30/23/31 — this
// component only carries the shell and copy, fed by the server page via props.
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
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-body">{description}</p>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-6 py-16 text-center">
        <p className="text-base font-semibold text-foreground">{emptyTitle}</p>
        <p className="max-w-md text-sm text-body">{emptyDescription}</p>
      </div>
    </main>
  );
}
