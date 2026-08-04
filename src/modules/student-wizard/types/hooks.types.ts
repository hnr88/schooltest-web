import type { WizardScreenProps } from '@/modules/student-wizard/types/student-wizard.types';

import type { StudentWizardOutput, StudentWizardValues } from '@/modules/student-wizard/schemas/student-wizard.schema';
import type { MediaAccept, MediaUploadLabels } from '@/modules/student-wizard/types/media.types';
import type { WizardMode } from '@/modules/student-wizard/types/student-wizard.types';

export interface UseMediaFieldParams {
  accept: MediaAccept;
  maxBytes: number;
  messages: Pick<MediaUploadLabels, 'invalidType' | 'tooLarge' | 'uploadFailed'>;
  onChange: (value: number | null) => void;
}

export interface UseStudentWizardParams {
  mode: WizardMode;
  initialValues?: Partial<StudentWizardValues>;
}

export interface UseWizardSubmitParams {
  onSubmit?: (values: StudentWizardOutput) => Promise<void>;
}

export interface UseWizardScreenOptions {
  initialValues: WizardScreenProps['initialValues'];
  mode: NonNullable<WizardScreenProps['mode']>;
  onSubmit: WizardScreenProps['onSubmit'];
}
