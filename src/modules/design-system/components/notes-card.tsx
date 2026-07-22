import { cn } from '@/lib/utils';

import type { NotesCardProps } from '@/modules/design-system/types/record.types';

// Canonical note surface (DS §06 "Textarea — note-taking variant": 1px DASHED
// #CBD5E1 on #FFFDF5) applied to the read-only teacher-note block the Student detail
// screen shows in a TintTile.
// The dashed rule and the cream fill are the whole point: a note is somebody's words
// quoted inside the product, and it must not read as another data panel. Body ink is
// --color-body at 7.4:1 on the cream.
function NotesCard({ title, author, timestamp, children, className }: NotesCardProps) {
  return (
    <figure
      data-slot="notes-card"
      className={cn(
        'flex flex-col gap-2 rounded-tile border border-dashed border-input bg-note-surface px-4 py-3.5',
        className,
      )}
    >
      {title ? (
        <figcaption className="text-overline font-bold tracking-rail text-muted-foreground uppercase">
          {title}
        </figcaption>
      ) : null}
      <blockquote className="text-body-sm leading-relaxed text-body">{children}</blockquote>
      {author || timestamp ? (
        <p className="flex flex-wrap items-center gap-x-2 text-meta text-muted-foreground">
          {author ? <span className="font-semibold text-foreground">{author}</span> : null}
          {timestamp}
        </p>
      ) : null}
    </figure>
  );
}

export { NotesCard };
