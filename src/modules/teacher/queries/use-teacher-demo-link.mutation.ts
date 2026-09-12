'use client';

import { useMutation } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  createDemoLinkBodySchema,
  createDemoLinkResponseSchema,
} from '@/modules/teacher/schemas/teacher-demo-link.schema';
import type {
  CreateDemoLinkBody,
  CreateDemoLinkResponse,
} from '@/modules/teacher/types/start-session.types';

// C-TT-DEMO: POST /api/teacher/demo-link -> 201 `{ url, web_url, expires_at,
// form_document_id, skill, variant }`. Minting a demo link spends the teacher's own
// magic-link budget and creates a single-use token, so it is a useMutation: never
// cached, never refetched on focus, never replayed by a re-render.
//
// Nothing is invalidated — a demo link creates no sitting, no session and no result;
// the trial it opens is the server's to record when the link is actually used.
async function createDemoLink(body: CreateDemoLinkBody): Promise<CreateDemoLinkResponse> {
  const payload = createDemoLinkBodySchema.parse(body);
  const response = await strapi.post('/api/teacher/demo-link', payload);
  return createDemoLinkResponseSchema.parse(response.data);
}

export function useTeacherDemoLinkMutation() {
  return useMutation({ mutationFn: createDemoLink });
}
