'use client';

import { useQuery } from '@tanstack/react-query';

import { DIAGNOSTIC_JSON_FORMAT } from '@schooltest/scoring-contracts';

import { strapi } from '@/lib/axios/strapi';
import {
  classExportSchema,
  type ClassExport,
} from '@/modules/results/schemas/class-export.schema';

/**
 * `C-CLASS-EXPORT` — the FIRST client consumer of
 * `GET /api/classes/{documentId}/export?format=diagnostic_json`. The route, the
 * service and the api contract have existed and been driven by an api e2e for
 * some time; what has never existed is a caller on either client.
 *
 * Family C: a BARE JSON document (no `{data, meta}` envelope), parsed strictly
 * at the axios boundary — SHARED-LAYER §API-envelopes. A leaked posterior or a
 * student name is therefore a parse failure here, not a wire leak that reaches a
 * screen.
 *
 * `enabled` defaults to FALSE, exactly as the single-result export hook does: an
 * export is an IMPERATIVE act — the teacher asks for a file — so screens call
 * `refetch()` from a control of their own. `staleTime: 0` because a class export
 * is never reused across sittings, and `retry: false` because the server's
 * refusals here are decisions, not blips: an over-cap roster is a 400 carrying
 * `{ student_count, max }`, a foreign class is a 403 and an unknown one a 404.
 * Retrying any of those just asks the same question again.
 */
export async function fetchClassExport(classDocumentId: string): Promise<ClassExport> {
  const response = await strapi.get(`/api/classes/${classDocumentId}/export`, {
    params: { format: DIAGNOSTIC_JSON_FORMAT },
  });
  return classExportSchema.parse(response.data);
}

export function useClassExportQuery(classDocumentId: string, enabled = false) {
  return useQuery({
    queryKey: ['results', 'class-export', classDocumentId],
    queryFn: () => fetchClassExport(classDocumentId),
    enabled: enabled && Boolean(classDocumentId),
    staleTime: 0,
    retry: false,
  });
}
