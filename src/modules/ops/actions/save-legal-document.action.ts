'use server';

import { updateTag } from 'next/cache';
import {
  RestContractViolation,
  legalSlugSchema,
  legalUpdateBodySchema,
  legalUpdatePath,
  legalUpdateResponseSchema,
  type LegalUpdateResponse,
} from '@schooltest/ops-contracts';
import { z } from 'zod';

import { strapi } from '@/lib/axios/strapi';
import { LEGAL_DOCUMENTS_REVALIDATE_TAG } from '@/modules/ops/constants/ops-settings.constants';

// Ledger 10 (D-008), C-LEG-03 — the legal-document PUT runs on the NEXT SERVER
// for the same MEASURED reason as the announcement save: the four public legal
// pages read through the `legal-documents` cache tag (`get-legal-document.ts`,
// `revalidate: 300`), and that tag can only be invalidated in-process by
// `revalidateTag`. The `POST /api/revalidate` route compares a server-to-server
// secret a browser must never hold, so — exactly like
// `save-announcement.action.ts` — the PUT moves here carrying the OPERATOR'S
// OWN token, authorisation stays the route's own ops-only policy, and the tag
// is invalidated only AFTER the API answered a real 200.
//
// The api resolves `:slug` against its own four-slug enum (anything else is a
// 404 before the body is read) and always writes the canonical `en` row.
const inputSchema = z.strictObject({
  token: z.string().min(1),
  slug: legalSlugSchema,
  body: legalUpdateBodySchema,
});

export async function saveLegalDocument(
  input: unknown,
): Promise<LegalUpdateResponse['data']> {
  const { token, slug, body } = inputSchema.parse(input);

  const res = await strapi.put<unknown>(legalUpdatePath(slug), body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const parsed = legalUpdateResponseSchema.safeParse(res.data);
  if (!parsed.success) throw new RestContractViolation(parsed.error.issues);

  // Only after the server actually accepted the write. `updateTag` (not
  // `revalidateTag(tag, 'max')`) because an operator must READ THEIR WRITE:
  // 'max' is stale-while-revalidate — the Next source only marks the path
  // revalidated when the profile's expire is 0, so with 'max' the public page
  // can keep serving the pre-edit bytes while a background refresh runs
  // (measured live: the first save showed, the second kept serving stale).
  // `updateTag` is the action-context primitive with exactly the
  // immediate-purge semantics this editor promises.
  updateTag(LEGAL_DOCUMENTS_REVALIDATE_TAG);

  return parsed.data.data;
}
