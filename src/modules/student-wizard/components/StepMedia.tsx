'use client';

import { Info } from 'lucide-react';
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

// Step 4 — Photo & voice (spec 03 §2.7): the small `PortalInfoPanel` under the
// heading, then a `1fr 1fr` pair of dropzones. photo = image ≤15MB,
// voice_intro = audio ≤10MB; each MediaUpload uploads immediately on selection
// (C-UPLOAD-PARENT) and stores the numeric file id (or null) on the shared RHF form.
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
    <div className="flex flex-col gap-5.5 duration-300 ease-out animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
      <p className="flex items-start gap-2.5 rounded-tile bg-surface-inset px-4 py-3 text-body-sm leading-relaxed text-body">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">{t('optionalNote')}</span>
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="photo"
          render={({ field }) => (
            <WizardField id="wizard-photo" label={t('photo.label')}>
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
            <WizardField id="wizard-voice-intro" label={t('voice.label')}>
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
