'use client';

import { CircleAlert, ImagePlus, Loader2, Mic, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/modules/design-system';
import { useMediaField } from '@/modules/student-wizard/hooks/use-media-field';
import type { MediaUploadProps } from '@/modules/student-wizard/types/media.types';

// C-UI-STUDENT-WIZARD §5.2 MediaUpload — drag/drop + file picker that uploads
// immediately (C-UPLOAD-PARENT) and stores the numeric file id (or null). Shows a
// spinner while pending, then an image thumb / audio player preview + remove.
export function MediaUpload({ accept, maxBytes, value, onChange, labels, inputId }: MediaUploadProps) {
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
  const ZoneIcon = isImage ? ImagePlus : Mic;

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
        <div className="relative overflow-hidden rounded-2xl border border-border bg-muted duration-300 ease-out animate-in fade-in zoom-in-95 motion-reduce:animate-none">
          {isImage ? (
            <Image
              src={media.url}
              alt={labels.previewAlt}
              width={640}
              height={280}
              unoptimized
              className="h-44 w-full object-cover"
            />
          ) : (
            <div className="flex flex-col gap-2 p-4">
              <span className="truncate text-sm font-medium text-foreground">{media.name}</span>
              <audio controls src={media.url} className="w-full">
                {media.name}
              </audio>
            </div>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={remove}
            className="absolute right-2 top-2 gap-1.5 shadow-sm transition duration-150 ease-out hover:scale-105 active:scale-95 motion-reduce:transition-none"
          >
            <X className="size-3.5" aria-hidden="true" />
            {labels.remove}
          </Button>
        </div>
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
          className={cn(
            'group flex min-h-36 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card p-6 text-center outline-none transition duration-200 ease-out hover:border-primary/60 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-70 data-[dragging]:border-primary data-[dragging]:bg-primary/10 motion-reduce:transition-none',
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-foreground transition-colors duration-200 ease-out group-hover:bg-primary/10 group-hover:text-primary motion-reduce:transition-none">
            {isPending ? (
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <ZoneIcon className="size-5" aria-hidden="true" />
            )}
          </span>
          <span className="text-sm font-semibold text-foreground">
            {isPending ? labels.uploading : labels.dropTitle}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Upload className="size-3.5" aria-hidden="true" />
            {labels.browse}
          </span>
          <span className="text-xs text-muted-foreground">{labels.helper}</span>
        </button>
      )}

      {error ? (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
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
