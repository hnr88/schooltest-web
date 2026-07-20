'use client';

import { useState } from 'react';

import { useUploadMediaMutation } from '@/modules/student-wizard/queries/use-upload-media.mutation';
import { useWizardMediaStore } from '@/modules/student-wizard/stores/use-wizard-media-store';
import type { MediaAccept, MediaUploadLabels } from '@/modules/student-wizard/types/media.types';
import type { WizardMediaKey } from '@/modules/student-wizard/types/student-wizard.types';

interface UseMediaFieldParams {
  accept: MediaAccept;
  maxBytes: number;
  messages: Pick<MediaUploadLabels, 'invalidType' | 'tooLarge' | 'uploadFailed'>;
  onChange: (value: number | null) => void;
}

// C-UPLOAD-PARENT client gate + upload orchestration for MediaUpload: validates
// type/size BEFORE any network call (no request when it fails), uploads
// immediately on selection, and surfaces §5.2 inline errors. The returned media
// (url/mime/name) lives in the wizard media store keyed by field (image → photo,
// audio → voice_intro) so the Step 5 review + step revisits reuse the preview.
// Removing clears both the store entry and the form value (no server delete).
export function useMediaField({ accept, maxBytes, messages, onChange }: UseMediaFieldParams) {
  const fieldKey: WizardMediaKey = accept === 'image/*' ? 'photo' : 'voice_intro';
  const media = useWizardMediaStore((state) => state.media[fieldKey]);
  const setMedia = useWizardMediaStore((state) => state.setMedia);
  const clearMedia = useWizardMediaStore((state) => state.clearMedia);
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
        setMedia(fieldKey, uploaded);
        onChange(uploaded.id);
      },
      onError: () => setError(messages.uploadFailed),
    });
  };

  const remove = () => {
    clearMedia(fieldKey);
    setError(null);
    onChange(null);
  };

  return { media, error, isPending, selectFile, remove };
}
