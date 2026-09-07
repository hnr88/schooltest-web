'use server';

import { revalidateTag } from 'next/cache';
import {
  OpsAnnouncementOperation,
  RestContractViolation,
  announcementBodySchema,
  announcementResponseSchema,
  type AnnouncementResponse,
} from '@schooltest/ops-contracts';
import { z } from 'zod';

import { strapi } from '@/lib/axios/strapi';
import { PLATFORM_SETTINGS_REVALIDATE_TAG } from '@/modules/ops/constants/ops-settings.constants';

// C-OPSF-04 transport, and this runs on the NEXT SERVER for a MEASURED reason,
// not a preference.
//
// The announcement drives `PublicSiteBanner` on cached public pages, so saving
// it has to invalidate the `platform-settings` cache tag or the operator's
// banner does not appear until the read helper's window lapses. The two ways to
// invalidate are `revalidateTag` (in-process, server only) and
// `POST /api/revalidate` — and that route compares `x-revalidate-secret` in
// constant time and is documented as server-to-server, called today only by the
// API's sitemap action. A browser cannot hold that secret; shipping it to the
// client to "fix" this would turn a cache hint into a published credential.
//
// So the PUT itself moves here, and it carries the OPERATOR'S OWN token exactly
// as `teacher-export.action.ts` does. That placement also makes the ordering
// honest: authorisation is the route's own ops-only policy (a non-ops token is
// a 403 from Strapi, not a check invented here), and the tag is only ever
// invalidated AFTER a real 200. A client that merely claimed success could not
// trigger it.
const inputSchema = z.strictObject({
  token: z.string().min(1),
  body: announcementBodySchema,
});

export async function saveAnnouncement(input: unknown): Promise<AnnouncementResponse['data']> {
  const { token, body } = inputSchema.parse(input);

  const res = await strapi.put<unknown>(OpsAnnouncementOperation.path, body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const parsed = announcementResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);

  // Only after the server actually accepted the write.
  revalidateTag(PLATFORM_SETTINGS_REVALIDATE_TAG, 'max');

  return parsed.data.data;
}
