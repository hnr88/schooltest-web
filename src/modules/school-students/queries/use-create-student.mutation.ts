'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { strapi, type StrapiSingleResponse } from '@/lib/axios/strapi';
import {
  CONSENT_CONFIG_QUERY_KEY,
  classifyConsentError,
  useConsentAttestation,
} from '@/modules/privacy-consent';
import type { ConsentAttestationBody } from '@/modules/privacy-consent';
import { SCHOOL_CHILDREN_QUERY_KEY } from '@/modules/school-students/constants/queries.constants';
import { schoolStudentDetailSchema } from '@/modules/school-students/schemas/school-student.schema';
import type {
  StudentWriteBody,
  SchoolStudentDetail,
} from '@/modules/school-students/types/school-students.types';
import { ENTITLEMENT_QUERY_KEY } from '@/modules/school-students/constants/queries.constants';

// C-CHD-02: create the student inside the caller's own school (the school comes
// from the session server-side, never from the body). The seat gate may 403
// with SEAT_CAP / SCHOOL_INACTIVE — classify-student-error maps those.
//
// W4-21: when the add-student form holds a school attestation (consent records ON
// and a box ticked) it rides along as the optional `consent_attestation` object W4-14
// accepts. It is built here, from the form's attestation value, and never enters the
// student form schema; with none the request body is exactly the student body.
async function createStudentRequest(
  body: StudentWriteBody,
  attestation: ConsentAttestationBody | undefined,
): Promise<SchoolStudentDetail> {
  const payload = attestation === undefined ? body : { ...body, consent_attestation: attestation };
  const res = await strapi.post<StrapiSingleResponse<unknown>>('/api/schools/me/children', payload);
  return schoolStudentDetailSchema.parse(res.data.data);
}

export function useCreateStudentMutation() {
  const queryClient = useQueryClient();
  const consent = useConsentAttestation();
  return useMutation({
    mutationFn: (body: StudentWriteBody) => createStudentRequest(body, consent?.attestation),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SCHOOL_CHILDREN_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ENTITLEMENT_QUERY_KEY });
    },
    onError: (error) => {
      // 409 GUARDIAN_CONSENT_REQUIRED / CONSENT_RECORDS_DISABLED: the switches the form
      // loaded are stale. Say so next to the boxes and re-read them.
      const kind = classifyConsentError(error);
      if (kind === 'guardianRequired' || kind === 'disabled') {
        consent?.reportRefusal(kind);
        void queryClient.invalidateQueries({ queryKey: CONSENT_CONFIG_QUERY_KEY });
      }
    },
  });
}
