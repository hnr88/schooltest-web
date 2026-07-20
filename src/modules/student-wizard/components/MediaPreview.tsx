'use client';

import { X } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/modules/design-system';
import type { UploadedMedia } from '@/modules/student-wizard/types/media.types';

interface MediaPreviewProps {
  media: UploadedMedia;
  isImage: boolean;
  previewAlt: string;
  removeLabel: string;
  onRemove: () => void;
}

// C-UI-STUDENT-WIZARD §5.2 preview surface: image thumbnail or <audio controls>
// from the absolutized upload url, with a remove control that clears the field
// (no server delete — contract). Uploaded media lives on the API origin, which is
// not in images.remotePatterns, so the thumbnail is served `unoptimized`.
export function MediaPreview({ media, isImage, previewAlt, removeLabel, onRemove }: MediaPreviewProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-muted duration-300 ease-out animate-in fade-in zoom-in-95 motion-reduce:animate-none">
      {isImage ? (
        <Image
          src={media.url}
          alt={previewAlt}
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
        onClick={onRemove}
        className="absolute right-2 top-2 gap-1.5 shadow-sm transition duration-150 ease-out hover:scale-105 active:scale-95 motion-reduce:transition-none"
      >
        <X className="size-3.5" aria-hidden="true" />
        {removeLabel}
      </Button>
    </div>
  );
}
