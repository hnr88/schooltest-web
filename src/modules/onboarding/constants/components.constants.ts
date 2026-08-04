import { CircleCheck, Users, type LucideIcon } from 'lucide-react';
import type { OnboardingStepKey, WizardStepKey } from '@/modules/onboarding/types/components.types';

export const PROFILE_FIELDS = new Set<string>([
  'first_name',
  'last_name',
  'relationship_to_student',
  'occupation',
  'phone',
  'secondary_phone',
  'preferred_contact_method',
  'address_line',
  'city',
  'state_region',
  'postal_code',
  'country_of_residence',
  'emergency_contact_name',
  'emergency_contact_phone',
  'emergency_contact_relationship',
]);

export const STEPS: WizardStepKey[] = ['welcome', 'profile', 'finish'];

export const STEP_ICONS: Record<OnboardingStepKey, LucideIcon> = {
  welcome: Users,
  finish: CircleCheck,
};

export const STEP_KEY_PREFIX: Record<OnboardingStepKey, string> = {
  welcome: 'stepWelcome',
  finish: 'finish',
};
