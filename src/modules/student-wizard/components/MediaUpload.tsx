'use client';

import { CircleAlert, ImageIcon, Loader2, Mic } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';

import { MediaPreview } from '@/modules/student-wizard/components/MediaPreview';
import { useMediaField } from '@/modules/student-wizard/hooks/use-media-field';
import type { MediaUploadProps } from '@/modules/student-wizard/types/media.types';

// `PortalDropzone` (spec 03 §2.7): a 1.5px dashed #C4CEDC box at radius 16 and
// padding 30/20, a 46px #EEF1F6 icon well over a 14/600 title, the 12.5px
// drag-and-drop line and the 11.5px constraint line, going #2563EB on hover.
// The design draws no filled state, no progress and no remove control — those are
// the C-UPLOAD-PARENT behaviours this component already owns (§UNKNOWNS): the
// client gate runs BEFORE any request, the upload fires on selection, and the
// zone swaps for a real preview + remove once it lands.
export function MediaUpload({
  accept,
  maxBytes,
  value,
  onChange,
  labels,
  inputId,
}: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { media, error, isPending, selectFile, remove } = useMediaField({
    accept,
    maxBytes,
    messages: labels,
    onChange,
  });

  const isImage = accept === 'image/*';
  const showPreview = media !== null && value !== null;
  const ZoneIcon = isImage ? ImageIcon : Mic;

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) selectFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) selectFile(file);
  };

  return (
    <div className="flex flex-col gap-2">
      {showPreview ? (
        <MediaPreview
          media={media}
          isImage={isImage}
          previewAlt={labels.previewAlt}
          removeLabel={labels.remove}
          onRemove={remove}
        />
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          disabled={isPending}
          data-dragging={isDragging || undefined}
          className="group flex flex-col items-center justify-center rounded-panel border-2 border-input border-dashed bg-card px-5 py-7.5 text-center transition duration-200 ease-out-expo hover:-translate-y-px hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70 data-[dragging]:border-primary data-[dragging]:bg-blue-50 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <span className="mb-3 grid size-11.5 place-items-center rounded-full bg-surface-inset text-foreground transition-colors duration-200 ease-out group-hover:bg-blue-100 group-hover:text-primary motion-reduce:transition-none">
            {isPending ? (
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <ZoneIcon className="size-5" aria-hidden="true" strokeWidth={1.8} />
            )}
          </span>
          <span className="text-body-md font-semibold text-foreground">
            {isPending ? labels.uploading : labels.dropTitle}
          </span>
          <span className="mt-0.75 text-meta text-body">{labels.browse}</span>
          <span className="mt-2 text-micro text-muted-foreground">{labels.helper}</span>
        </button>
      )}

      {error ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-destructive duration-200 ease-out animate-in fade-in slide-in-from-top-0.5 motion-reduce:animate-none">
          <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        onChange={handleInput}
        className="hidden"
      />
    </div>
  );
}
