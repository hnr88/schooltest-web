'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { reviewStudentSchema } from '@/modules/report/schemas/review-student.schema';
import type { ReviewStudent } from '@/modules/report/types/review.types';

/**
 * GET /api/students/:documentId — the ONE hook on this read. It names the
 * student and class for a review drawer opened from a result page, whose
 * result view carries neither. A refused read (not this teacher's student)
 * just leaves them out of the header, so it is not retried.
 */
export async function fetchReviewStudent(documentId: string): Promise<ReviewStudent> {
  const response = await strapi.get(
    `/api/students/${encodeURIComponent(documentId)}?fields[0]=given_name&fields[1]=family_name&populate[class][fields][0]=name`,
  );
  return reviewStudentSchema.parse(response.data).data;
}

export function useReviewStudentQuery(documentId: string | null | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['students', 'review', documentId],
    queryFn: () => fetchReviewStudent(documentId ?? ''),
    enabled: enabled && Boolean(documentId),
    retry: false,
  });
}
