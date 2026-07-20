'use client';

import { Pencil } from 'lucide-react';
import Image from 'next/image';
import type { ReactNode } from 'react';

import { Button } from '@/modules/design-system';
import type { UploadedMedia } from '@/modules/student-wizard/types/media.types';

interface ReviewSectionProps {
  title: string;
  editLabel: string;
  onEdit: () => void;
  children: ReactNode;
}

// C-UI-STUDENT-WIZARD Step 5 — a per-section summary card with an "Edit" link
// jumping back to that step (goToStep). Subtle entrance + the DS Button's own
// hover/active motion satisfy the motion baseline.
export function ReviewSection({ title, editLabel, onEdit, children }: ReviewSectionProps) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm duration-300 ease-out animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="gap-1.5 text-primary transition duration-150 ease-out hover:scale-105 active:scale-95 motion-reduce:transition-none"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
          {editLabel}
        </Button>
      </div>
      <dl className="flex flex-col divide-y divide-border">{children}</dl>
    </section>
  );
}

interface ReviewRowProps {
  label: string;
  value: string | null;
  emptyLabel: string;
}

// Label/value row; empty optionals render "—" in the muted token (spec #94A3B8).
export function ReviewRow({ label, value, emptyLabel }: ReviewRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="shrink-0 text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right text-sm text-foreground">
        {value ?? <span className="text-muted-foreground">{emptyLabel}</span>}
      </dd>
    </div>
  );
}

interface ReviewMediaRowProps {
  label: string;
  media: UploadedMedia | null;
  isImage: boolean;
  emptyLabel: string;
  previewAlt: string;
}

// Media row: image thumbnail or <audio controls> preview reusing the absolutized
// url from the wizard media store, or "—" when nothing was uploaded.
export function ReviewMediaRow({ label, media, isImage, emptyLabel, previewAlt }: ReviewMediaRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className="shrink-0 text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0">
        {media === null ? (
          <span className="text-sm text-muted-foreground">{emptyLabel}</span>
        ) : isImage ? (
          <Image
            src={media.url}
            alt={previewAlt}
            width={96}
            height={64}
            unoptimized
            className="h-16 w-24 rounded-lg border border-border object-cover duration-300 ease-out animate-in fade-in zoom-in-95 motion-reduce:animate-none"
          />
        ) : (
          <audio controls src={media.url} className="max-w-56">
            {media.name}
          </audio>
        )}
      </dd>
    </div>
  );
}
