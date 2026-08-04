'use client';

import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useRouter } from '@/i18n/navigation';
import { writeClientToken } from '@/lib/axios/strapi';
import { classifyLinkError } from '@/modules/school-onboarding/lib/classify-link-error';
import { useCompleteOnboardingMutation } from '@/modules/school-onboarding/queries/use-complete-onboarding.mutation';
import {
  destroySchoolOnboardingStore,
  getSchoolOnboardingStore,
} from '@/modules/school-onboarding/stores/use-school-onboarding-store';
import type { AdminAccountValues } from '@/modules/school-onboarding/schemas/school-onboarding.schema';
import type { OnboardingLinkState } from '@/modules/school-onboarding/types/school-onboarding.types';

import type { StrapiErrorBody } from '@/modules/school-onboarding/types/hooks.types';

/**
 * Final-step orchestration (C-ONB-03): persists the admin details, posts the
 * completion body, stores the returned JWT and sends the new school_admin to
 * the dashboard (task 27 owns the redirect target). 400 surfaces the server's
 * validation message; 409 means the link was already used elsewhere.
 */
export function useCompleteOnboarding(token: string) {
  const t = useTranslations('SchoolOnboarding.errors');
  const router = useRouter();
  const mutation = useCompleteOnboardingMutation();
  const [serverError, setServerError] = useState<string | null>(null);
  // The terminal link state the SUBMIT discovered, if any. A guest can be
  // holding the wizard open when ops revokes the invitation (mission
  // st-ops-onboarding), so 410 has to land on the right screen rather than on
  // the generic "could not finish setup" message.
  const [linkState, setLinkState] = useState<OnboardingLinkState | null>(null);

  const submit = (values: AdminAccountValues) => {
    const store = getSchoolOnboardingStore(token);
    store.getState().setAdmin({
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
    });
    const { payload, provenance } = store.getState();
    setServerError(null);
    mutation.mutate(
      {
        token,
        payload,
        provenance,
        admin: {
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          password: values.password,
        },
        teachers: payload.teachers,
      },
      {
        onSuccess: (result) => {
          writeClientToken(result.jwt);
          store.getState().reset();
          store.persist.clearStorage();
          destroySchoolOnboardingStore(token);
          router.push('/dashboard');
        },
        onError: (error) => {
          if (isAxiosError<StrapiErrorBody>(error)) {
            const status = error.response?.status;
            if (status === 409 || status === 410) {
              setLinkState(classifyLinkError(error));
              return;
            }
            if (status === 400) {
              setServerError(error.response?.data?.error?.message ?? t('completeFailed'));
              return;
            }
          }
          setServerError(t('completeFailed'));
        },
      },
    );
  };

  return { submit, pending: mutation.isPending, serverError, linkState };
}
