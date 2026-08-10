import type { LucideIcon } from 'lucide-react';

import { EmptyState } from '@/modules/design-system';

interface TeacherPagePlaceholderProps {
  surface: string;
  icon: LucideIcon;
  title: string;
  description: string;
  placeholderTitle: string;
  placeholderDescription: string;
}

// The real page shell for a teacher surface whose feature UI has not landed yet
// (tasks 034-038 for sessions, 040-046 for results). It exists so no rail entry
// points at a 404.
//
// It states that the tools are not on the page yet — it NEVER claims "no sessions"
// or "no results", because it issues no query and therefore knows nothing about the
// data. An emptiness claim without a read would be canned data by another name.
function TeacherPagePlaceholder({
  surface,
  icon,
  title,
  description,
  placeholderTitle,
  placeholderDescription,
}: TeacherPagePlaceholderProps) {
  return (
    <main
      data-surface={surface}
      className="flex flex-1 animate-in flex-col gap-6 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8 lg:py-7"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-portal-title font-bold text-foreground">{title}</h1>
        <p className="text-lede text-muted-foreground">{description}</p>
      </div>

      <section
        data-slot="teacher-placeholder"
        className="flex flex-col rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
      >
        <EmptyState
          icon={icon}
          tone="brand"
          title={placeholderTitle}
          description={placeholderDescription}
          className="border-none px-0 py-2"
        />
      </section>
    </main>
  );
}

export { TeacherPagePlaceholder };
