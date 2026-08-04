import type { UploadedMedia } from '@/modules/student-wizard/types/media.types';
import type { WizardMediaKey } from '@/modules/student-wizard/types/student-wizard.types';

export const EMPTY_MEDIA: Record<WizardMediaKey, UploadedMedia | null> = {
  photo: null,
  voice_intro: null,
};
