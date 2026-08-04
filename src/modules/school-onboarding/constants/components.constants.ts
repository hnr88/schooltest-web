import { CircleCheck, Clock, Link2Off, TriangleAlert } from 'lucide-react';
import type { OnboardingLinkState, TeacherEntry } from '@/modules/school-onboarding/types/school-onboarding.types';
import type { LucideIcon } from 'lucide-react';

export const STATE_ICONS: Record<OnboardingLinkState, LucideIcon> = {
  invalid: Link2Off,
  expired: Clock,
  revoked: Link2Off,
  used: CircleCheck,
  unavailable: TriangleAlert,
};

export const EMPTY_TEACHER: TeacherEntry = { first_name: '', last_name: '', email: '', role: 'teacher' };
