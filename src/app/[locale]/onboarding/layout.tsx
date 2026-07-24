'use client';

import type { ReactNode } from 'react';

import { ParentGuard } from '@/modules/auth';

// Client guard for the onboarding flow (task 025 / C-ONBOARD-GET). The guard
// hydrates the auth store from localStorage and redirects unauthenticated
// visitors to /sign-in before the onboarding queries can fire.
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <ParentGuard>{children}</ParentGuard>;
}
