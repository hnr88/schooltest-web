'use client';

import { useMutation } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import { registerSchema } from '@/modules/eald/schemas/register.schema';

interface PilotRegisterResponse {
  data: { received: boolean; documentId: string; deduped: boolean };
  meta: Record<string, unknown>;
}

async function pilotRegisterRequest(
  input: ReturnType<typeof registerSchema.parse>,
): Promise<PilotRegisterResponse['data']> {
  const payload = registerSchema.parse(input);
  const res = await strapi.post<PilotRegisterResponse>('/api/pilot-registrations/submit', payload);
  return res.data.data;
}

// Lane J: the landing "register your interest" form posts to the real public
// endpoint (POST /api/pilot-registrations/submit, rate-limited 5/10min/IP).
// Success (fresh row or deduped repeat) swaps the section to the success card.
export function usePilotRegisterMutation() {
  return useMutation({ mutationFn: pilotRegisterRequest });
}
