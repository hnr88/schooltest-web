'use client';

import { Lock, Sparkles } from 'lucide-react';

import { TeacherExportButton } from '@/modules/teacher/components/TeacherExportButton';
import type { TeacherExportPanelProps } from '@/modules/teacher/types/teacher-export.types';

// The class-level export panel, shared by the Teaching insights and Progress tabs
// (.qa/DESIGN.md §Teaching insights 3 / §Progress tab). Same structure both times —
// title, one line of purpose, the button, and the de-identification footnote the
// wireframe puts behind a lock glyph — so the two tabs cannot drift apart. The copy
// itself is passed in already translated, because each tab names its own document.
//
// The footnote is not decoration: it is the teacher's assurance that what leaves
// the building carries `S01`-style ids only. It is TEXT, so a screen reader and a
// printout state it as plainly as the sighted screen does.
function TeacherExportPanel({
  request,
  headingId,
  title,
  description,
  buttonLabel,
  footnote,
}: TeacherExportPanelProps) {
  return (
    <section
      data-slot="teacher-export-panel"
      data-export-kind={request.kind}
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
    >
      <div className="flex flex-col gap-1">
        <h2
          id={headingId}
          className="flex items-center gap-2 text-panel-title font-bold text-foreground"
        >
          <Sparkles aria-hidden="true" className="size-4.5 text-primary" />
          {title}
        </h2>
        <p className="text-meta text-body">{description}</p>
      </div>

      <TeacherExportButton request={request} label={buttonLabel} />

      <p data-slot="teacher-export-footnote" className="flex items-start gap-2 text-meta text-body">
        <Lock aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        <span>{footnote}</span>
      </p>
    </section>
  );
}

export { TeacherExportPanel };
