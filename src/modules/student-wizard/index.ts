export { WizardScreen } from './components/WizardScreen';
export { WizardStepper } from './components/WizardStepper';
export { WizardNav } from './components/WizardNav';
export { StepPersonal } from './components/StepPersonal';
export { StepEducation } from './components/StepEducation';
export { StepGuardian } from './components/StepGuardian';
export { StepMedia } from './components/StepMedia';
export { MediaUpload } from './components/MediaUpload';
export { ContactChannelCards } from './components/ContactChannelCards';
export { NationalityCombobox } from './components/NationalityCombobox';

export { useUploadMediaMutation } from './queries/use-upload-media.mutation';
export { toAbsoluteMediaUrl } from './lib/media-url';

export type {
  MediaAccept,
  MediaUploadLabels,
  MediaUploadProps,
  UploadedMedia,
} from './types/media.types';

export {
  COUNTRY_CODES,
  getCountryOptions,
  getCountryNames,
  type CountryCode,
  type CountryOption,
} from './constants/countries.constants';

export { useStudentWizard } from './hooks/use-student-wizard';

export {
  createStudentWizardSchema,
  STEP_FIELDS,
  type StudentWizardValues,
  type StudentWizardOutput,
} from './schemas/student-wizard.schema';

export {
  CONTACT_CHANNELS,
  CONTACT_CHANNEL_VALUES,
  CURRENT_YEAR_LEVEL_VALUES,
  GENDER_VALUES,
  PHOTO_MAX_BYTES,
  PHOTO_MAX_MB,
  TARGET_ENTRY_YEARS,
  TERM_VALUES,
  VOICE_INTRO_MAX_BYTES,
  VOICE_INTRO_MAX_MB,
  WIZARD_STEP_COUNT,
  WIZARD_STEP_KEYS,
  YEAR_LEVEL_VALUES,
} from './constants/student-wizard.constants';

export type {
  ContactChannel,
  ContactChannelOption,
  CurrentYearLevel,
  Gender,
  Term,
  WizardMode,
  WizardScreenProps,
  WizardStepKey,
} from './types/student-wizard.types';
