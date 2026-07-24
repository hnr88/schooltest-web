'use client';

import { useTranslations } from 'next-intl';
import { Controller, useFormContext, useFormState } from 'react-hook-form';

import { MediaUpload } from '@/modules/student-wizard/components/MediaUpload';
import { WizardField } from '@/modules/student-wizard/components/WizardField';
import {
  PHOTO_MAX_BYTES,
  VOICE_INTRO_MAX_BYTES,
} from '@/modules/student-wizard/constants/student-wizard.constants';
import type { MediaUploadLabels } from '@/modules/student-wizard/types/media.types';
import type { StudentWizardValues } from '@/modules/student-wizard/types/student-wizard.types';

// Step 4 — Photo & voice (spec 03 §2.7): a `1fr 1fr` pair of dropzones, both
// mandatory. photo = image ≤15MB, voice_intro = audio ≤10MB; each MediaUpload
// uploads immediately on selection (C-UPLOAD-PARENT) and stores the numeric
// file id (or null) on the shared RHF form — null fails the required rule.
export function StepMedia() {
  const t = useTranslations('StudentWizard.media');
  const { control } = useFormContext<StudentWizardValues>();
  const { errors } = useFormState({ control });

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
    <div className="flex flex-col gap-5.5 duration-300 ease-out animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="photo"
          render={({ field }) => (
            <WizardField id="wizard-photo" label={t('photo.label')} required error={errors.photo?.message}>
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
            <WizardField
              id="wizard-voice-intro"
              label={t('voice.label')}
              required
              error={errors.voice_intro?.message}
            >
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
    </div>
  );
}
