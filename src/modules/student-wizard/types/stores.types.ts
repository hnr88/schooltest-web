import type { UploadedMedia } from '@/modules/student-wizard/types/media.types';
import type { WizardMediaKey } from '@/modules/student-wizard/types/student-wizard.types';

export interface WizardMediaState {
  media: Record<WizardMediaKey, UploadedMedia | null>;
  setMedia: (key: WizardMediaKey, media: UploadedMedia) => void;
  clearMedia: (key: WizardMediaKey) => void;
  reset: () => void;
}
