'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm, type DefaultValues } from 'react-hook-form';

import type { AuthUser } from '@/modules/auth';
import { createParentProfileSchema } from '@/modules/onboarding/schemas/parent-profile.schema';
import type {
  ParentProfileOutput,
  ParentProfileValues,
} from '@/modules/onboarding/types/parent-profile.types';

function profileDefaults(user: AuthUser | null): DefaultValues<ParentProfileValues> {
  return {
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    relationship_to_student: user?.relationship_to_student ?? undefined,
    occupation: user?.occupation ?? '',
    phone: user?.phone ?? '',
    secondary_phone: user?.secondary_phone ?? '',
    preferred_contact_method: user?.preferred_contact_method ?? undefined,
    address_line: user?.address_line ?? '',
    city: user?.city ?? '',
    state_region: user?.state_region ?? '',
    postal_code: user?.postal_code ?? '',
    country_of_residence: user?.country_of_residence ?? '',
    emergency_contact_name: user?.emergency_contact_name ?? '',
    emergency_contact_phone: user?.emergency_contact_phone ?? '',
    emergency_contact_relationship: user?.emergency_contact_relationship ?? '',
  };
}

// RHF + Zod wiring for the parent-profile step, prefilled from GET /users/me
// (C-PAR-ME carries the whitelist fields for parents).
export function useParentProfileForm(user: AuthUser | null) {
  const t = useTranslations('Onboarding.schema');
  const schema = useMemo(() => createParentProfileSchema(t), [t]);

  return useForm<ParentProfileValues, unknown, ParentProfileOutput>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: profileDefaults(user),
  });
}
