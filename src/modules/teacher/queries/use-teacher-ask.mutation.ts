'use client';

import { useMutation } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  teacherAskBodySchema,
  teacherAskResponseSchema,
} from '@/modules/teacher/schemas/teacher-ask.schema';
import type { TeacherAskBody, TeacherAskResponse } from '@/modules/teacher/types/ask-ai.types';

// C-TA-1: POST /api/teacher/ask -> 200 `{ answer, grounding, refused }`, the ONE
// endpoint behind both Ask AI drawers. The body is parsed before the request so a
// 501-character question fails here rather than as a server 400, and the answer is
// parsed on the way back so an unknown key never reaches a teacher.
//
// A useMutation, not a useQuery: a question is an imperative act, must never be
// cached, replayed on focus, or re-sent when the drawer re-renders. It invalidates
// nothing either — asking changes no server state.
//
// `refused: true` is a SUCCESS here (the model saying what this data covers). Only
// the transport statuses (400/403/404/429/503) reject, and `lib/ask-ai-thread.ts`
// turns those into the drawer's honest states.
async function askTeacherAi(body: TeacherAskBody): Promise<TeacherAskResponse> {
  const payload = teacherAskBodySchema.parse(body);
  const response = await strapi.post('/api/teacher/ask', payload);
  return teacherAskResponseSchema.parse(response.data);
}

export function useTeacherAskMutation() {
  return useMutation({ mutationFn: askTeacherAi });
}
