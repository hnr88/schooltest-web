'use client';

import { useState } from 'react';

import { useUploadMediaMutation } from '@/modules/student-wizard/queries/use-upload-media.mutation';
import type {
  MediaAccept,
  MediaUploadLabels,
  UploadedMedia,
} from '@/modules/student-wizard/types/media.types';

interface UseMediaFieldParams {
  accept: MediaAccept;
  maxBytes: number;
  messages: Pick<MediaUploadLabels, 'invalidType' | 'tooLarge' | 'uploadFailed'>;
  onChange: (value: number | null) => void;
}

// C-UPLOAD-PARENT client gate + upload orchestration for MediaUpload: validates
// type/size BEFORE any network call (no request when it fails), uploads
// immediately on selection, holds the returned media for preview, and surfaces
// §5.2 inline errors. Removing clears the preview and sets the form value null
// (no server delete — contract).
export function useMediaField({ accept, maxBytes, messages, onChange }: UseMediaFieldParams) {
  const [media, setMedia] = useState<UploadedMedia | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { mutate, isPending } = useUploadMediaMutation();

  const mimePrefix = accept.replace('/*', '/');

  const selectFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith(mimePrefix)) {
      setError(messages.invalidType);
      return;
    }
    if (file.size > maxBytes) {
      setError(messages.tooLarge);
      return;
    }
    mutate(file, {
      onSuccess: (uploaded) => {
        setMedia(uploaded);
        onChange(uploaded.id);
      },
      onError: () => setError(messages.uploadFailed),
    });
  };

  const remove = () => {
    setMedia(null);
    setError(null);
    onChange(null);
  };

  return { media, error, isPending, selectFile, remove };
}
