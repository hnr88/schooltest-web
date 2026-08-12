import { EmptyState } from '@/modules/design-system';
import type { ResultsTabPendingProps } from '@/modules/teacher/types/results-shell.types';

// Task 040 ships the FRAME; the Students table (041), Teaching insights (044) and
// Progress (045) fill their own panels. Until then a tab says that its tool is
// not on the page yet.
//
// It issues no query, so it makes no claim about the class: it never says "no
// students", "no gaps" or "no progress". An emptiness claim without a read is
// canned data by another name — the same discipline TeacherPagePlaceholder
// already carries.
function ResultsTabPending({ slot, icon, title, description }: ResultsTabPendingProps) {
  return (
    <section
      data-slot="results-tab-pending"
      data-tab={slot}
      className="flex flex-col rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
    >
      <EmptyState
        icon={icon}
        tone="brand"
        title={title}
        description={description}
        className="border-none px-0 py-2"
      />
    </section>
  );
}

export { ResultsTabPending };
