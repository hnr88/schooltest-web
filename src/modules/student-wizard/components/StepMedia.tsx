'use client';

import { useTranslations } from 'next-intl';
import { Controller, useFormContext } from 'react-hook-form';

import { MediaUpload } from '@/modules/student-wizard/components/MediaUpload';
import { WizardField } from '@/modules/student-wizard/components/WizardField';
import {
  PHOTO_MAX_BYTES,
  VOICE_INTRO_MAX_BYTES,
} from '@/modules/student-wizard/constants/student-wizard.constants';
import type { MediaUploadLabels } from '@/modules/student-wizard/types/media.types';
import type { StudentWizardValues } from '@/modules/student-wizard/types/student-wizard.types';

// C-UI-STUDENT-WIZARD step 4 — photo (image ≤15MB) + voice_intro (audio ≤10MB).
// Each MediaUpload uploads immediately on selection (C-UPLOAD-PARENT) and stores
// the numeric file id (or null) on the shared RHF form (048).
export function StepMedia() {
  const t = useTranslations('StudentWizard.media');
  const { control } = useFormContext<StudentWizardValues>();

  const photoLabels: MediaUploadLabels = {
    dropTitle: t('photo.dropTitle'),
    browse: t('browse'),
    helper: t('photo.helper'),
    uploading: t('uploading'),
    remove: t('remove'),
    previewAlt: t('photo.previewAlt'),
    invalidType: t('photo.invalidType'),
    tooLarge: t('photo.tooLarge'),
    uploadFailed: t('uploadFailed'),
  };

  const voiceLabels: MediaUploadLabels = {
    dropTitle: t('voice.dropTitle'),
    browse: t('browse'),
    helper: t('voice.helper'),
    uploading: t('uploading'),
    remove: t('remove'),
    previewAlt: t('voice.previewAlt'),
    invalidType: t('voice.invalidType'),
    tooLarge: t('voice.tooLarge'),
    uploadFailed: t('uploadFailed'),
  };

  return (
    <div className="flex flex-col gap-5 duration-300 ease-out animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
      <Controller
        control={control}
        name="photo"
        render={({ field }) => (
          <WizardField label={t('photo.label')}>
            <MediaUpload
              accept="image/*"
              maxBytes={PHOTO_MAX_BYTES}
              value={field.value ?? null}
              onChange={field.onChange}
              labels={photoLabels}
              inputId="wizard-photo"
            />
          </WizardField>
        )}
      />
      <Controller
        control={control}
        name="voice_intro"
        render={({ field }) => (
          <WizardField label={t('voice.label')}>
            <MediaUpload
              accept="audio/*"
              maxBytes={VOICE_INTRO_MAX_BYTES}
              value={field.value ?? null}
              onChange={field.onChange}
              labels={voiceLabels}
              inputId="wizard-voice-intro"
            />
          </WizardField>
        )}
      />
    </div>
  );
}
