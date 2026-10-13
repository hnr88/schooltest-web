'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { SCHOOL_CHILDREN_QUERY_KEY } from '@/modules/school-students/constants/queries.constants';
import {
  CONSENT_CONFIG_QUERY_KEY,
  STUDENT_CONSENTS_QUERY_KEY,
} from '@/modules/privacy-consent/constants/queries.constants';
import { classifyEraseError } from '@/modules/privacy-consent/lib/classify-erase-error';
import {
  eraseStudentBodySchema,
  eraseStudentResponseSchema,
} from '@/modules/privacy-consent/schemas/consent.schema';
import type {
  EraseStudentInput,
  EraseStudentResult,
} from '@/modules/privacy-consent/types/consent.types';

// POST /api/schools/me/children/:documentId/erase. Anonymises one ARCHIVED student of
// the caller's own school in place (W4-20); the answer is counts only.
async function eraseStudentRequest({ documentId, body }: EraseStudentInput): Promise<EraseStudentResult> {
  const res = await strapi.post(
    `/api/schools/me/children/${encodeURIComponent(documentId)}/erase`,
    eraseStudentBodySchema.parse(body),
  );
  return eraseStudentResponseSchema.parse(res.data).data;
}

export function useEraseStudentMutation() {
  const queryClient = useQueryClient();
  const refreshStudent = () => {
    // The student detail and the roster sit under one key prefix, so both re-read
    // and the page shows the tombstoned record.
    void queryClient.invalidateQueries({ queryKey: SCHOOL_CHILDREN_QUERY_KEY });
  };
  return useMutation({
    mutationFn: eraseStudentRequest,
    onSuccess: () => {
      refreshStudent();
      void queryClient.invalidateQueries({ queryKey: STUDENT_CONSENTS_QUERY_KEY });
    },
    onError: (error) => {
      const kind = classifyEraseError(error);
      // The switch was turned off since the page loaded: re-read it so the entry hides.
      if (kind === 'erasureDisabled') {
        void queryClient.invalidateQueries({ queryKey: CONSENT_CONFIG_QUERY_KEY });
      }
      // The status the page showed is stale: re-read the student.
      if (kind === 'notArchived' || kind === 'notFound') {
        refreshStudent();
      }
    },
  });
}
