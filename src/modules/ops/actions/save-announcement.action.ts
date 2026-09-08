'use server';

import { updateTag } from 'next/cache';
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
// invalidate are the in-process tag primitives (server only) and
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

  // Only after the server actually accepted the write. `updateTag` (not
  // `revalidateTag(tag, 'max')`) because an operator must READ THEIR WRITE:
  // 'max' is stale-while-revalidate — Next only marks the path revalidated when
  // the profile's expire is 0, so with 'max' the public pages under this tag
  // keep serving the PRE-EDIT banner while a background refresh runs (measured
  // live on this stack by the legal-editor slice: the first save showed, the
  // second kept serving stale for its whole window). `updateTag` is the
  // action-context primitive with exactly the immediate-purge semantics an
  // announcement promises, and it is legal here precisely because this is a
  // Server Action — the sibling `POST /api/revalidate` route CANNOT use it
  // (route handlers only have the SWR primitive).
  updateTag(PLATFORM_SETTINGS_REVALIDATE_TAG);

  return parsed.data.data;
}
