import type { ChoiceOption } from '@/modules/design-system';
import type { AdminAccountValues, SchoolDetailsValues } from '@/modules/school-onboarding/schemas/school-onboarding.schema';
import type { AdminDetails, OnboardingLinkState, OnboardingStepDefinition, SchoolDetails, SchoolOnboardingData, SchoolOnboardingPayload, TeacherEntry } from '@/modules/school-onboarding/types/school-onboarding.types';
import type { Control, FieldErrors, FieldValues, Path, UseFormRegister, UseFormRegisterReturn } from 'react-hook-form';

export interface AdminAccountStepProps {
  defaultValues: AdminDetails;
  serverError: string | null;
  pending: boolean;
  onSubmit: (values: AdminAccountValues) => void;
  onBack: () => void;
}

export interface OnboardingSelectFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  id: string;
  label: string;
  options: readonly ChoiceOption[];
  placeholder: string;
  error?: string;
}

export interface OnboardingStatusScreenProps {
  state: OnboardingLinkState;
}

export interface OnboardingStepperProps {
  steps: readonly OnboardingStepDefinition[];
  current: number;
}

export interface OnboardingTextFieldProps {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  helperText?: string;
  error?: string;
  registration: UseFormRegisterReturn;
}

export interface ReviewStepProps {
  payload: SchoolOnboardingPayload;
  onConfirm: () => void;
  onBack: () => void;
}

export interface SchoolDetailsStepProps {
  defaultValues: SchoolDetails;
  onSubmit: (values: SchoolDetailsValues) => void;
}

export interface SchoolOnboardingScreenProps {
  token: string;
}

export interface SchoolOnboardingWizardProps {
  token: string;
  data: SchoolOnboardingData;
}

export interface TeacherRowProps {
  control: Control<{ teachers: TeacherEntry[] }>;
  register: UseFormRegister<{ teachers: TeacherEntry[] }>;
  index: number;
  errors: FieldErrors<{ teachers: TeacherEntry[] }>;
  roleOptions: readonly ChoiceOption[];
  labels: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    rowLabel: string;
    remove: string;
  };
  onRemove: () => void;
}

export interface TeachersStepProps {
  defaultValues: TeacherEntry[];
  onSubmit: (teachers: TeacherEntry[]) => void;
  onBack: () => void;
}
