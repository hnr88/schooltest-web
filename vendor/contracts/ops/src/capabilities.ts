/**
 * OPS-075 — C-OPS-PORTAL-065 `GET /api/ops/capabilities`.
 *
 * ONE definition of "what may this authenticated portal account do", imported
 * by the server that ENFORCES it and by the client that merely RENDERS it.
 *
 * The property this module exists to protect: the five booleans are a
 * DESCRIPTION of server-side authority, never the authority itself. The API
 * re-checks the role and the users-permissions grant on every single request,
 * so a client that lies to itself about `write: true` still gets a 403. The
 * portal reads them only to stop showing an action it already knows will be
 * refused (mvp/ops/Ops Portal.dc.html:1068-1092 — the read-only account greys
 * the write items in every kebab menu rather than hiding them).
 *
 * `ops_support` is the narrow read/export account from
 * mvp/tasks/ops/contract-rules.md's role matrix: directory and detail reads,
 * approved downloads, self-profile edit — and nothing else. It is deliberately
 * NOT a subset expressed as "ops minus a few flags" at the route layer: the
 * server carries an explicit action allowlist, so a newly added ops write is
 * denied to support by default instead of being inherited.
 */
import { z } from 'zod';

import { dataEnvelope, documentIdSchema, type OpsOperation } from './core';

const NAME_MAX = 100;
const EMAIL_MAX = 255;
const STATUS_PAGE_URL_MAX = 2048;

/** The two portal role types. `ops` writes; `ops_support` reads and exports. */
export const OPS_ROLE_TYPE = 'ops';
export const OPS_SUPPORT_ROLE_TYPE = 'ops_support';

export const opsPortalRoleSchema = z.enum([OPS_ROLE_TYPE, OPS_SUPPORT_ROLE_TYPE]);
export type OpsPortalRole = z.infer<typeof opsPortalRoleSchema>;

export function isOpsPortalRole(value: unknown): value is OpsPortalRole {
  return opsPortalRoleSchema.safeParse(value).success;
}

/**
 * The five capability flags, exactly as the operation contract declares them.
 * Strict: an extra flag invented by one side fails the parse instead of being
 * silently ignored by the other.
 */
export const opsCapabilityFlagsSchema = z.strictObject({
  read: z.boolean(),
  write: z.boolean(),
  export: z.boolean(),
  view_as_teacher: z.boolean(),
  edit_self: z.boolean(),
});
export type OpsCapabilityFlags = z.infer<typeof opsCapabilityFlagsSchema>;

/**
 * The role -> flags matrix. `edit_self` is true for BOTH roles: the self
 * profile is a personal account, and contract-rules.md names it as the one
 * explicit support write exception. `view_as_teacher` impersonates a real
 * teacher, so it stays with `ops` alone.
 */
export const OPS_PORTAL_CAPABILITIES: Readonly<Record<OpsPortalRole, OpsCapabilityFlags>> =
  Object.freeze({
    ops: Object.freeze({
      read: true,
      write: true,
      export: true,
      view_as_teacher: true,
      edit_self: true,
    }),
    ops_support: Object.freeze({
      read: true,
      write: false,
      export: true,
      view_as_teacher: false,
      edit_self: true,
    }),
  });

/** Flags for a portal role. Returns a fresh object so a caller cannot mutate the matrix. */
export function capabilitiesForRole(role: OpsPortalRole): OpsCapabilityFlags {
  return { ...OPS_PORTAL_CAPABILITIES[role] };
}

/**
 * The status page the pictured error screen links to
 * (mvp/ops/Ops Portal.dc.html:135 — "Status page", beside "Try again").
 *
 * It is DEPLOYMENT configuration, not content: an absolute http(s) URL supplied
 * by the release. `null` means the release did not configure one — an explicit
 * setup failure the portal must surface, never a licence to drop the control.
 */
export const statusPageUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(STATUS_PAGE_URL_MAX)
  .pipe(z.url({ protocol: /^https?$/ }));

export const opsActorSchema = z.strictObject({
  documentId: documentIdSchema,
  first_name: z.string().max(NAME_MAX).nullable(),
  last_name: z.string().max(NAME_MAX).nullable(),
  email: z.string().min(1).max(EMAIL_MAX).pipe(z.email()),
  role: opsPortalRoleSchema,
  updatedAt: z.iso.datetime({ offset: true }),
});
export type OpsActor = z.infer<typeof opsActorSchema>;

export const capabilitiesResultSchema = z.strictObject({
  actor: opsActorSchema,
  capabilities: opsCapabilityFlagsSchema,
  status_page_url: z.string().max(STATUS_PAGE_URL_MAX).nullable(),
});
export type CapabilitiesResult = z.infer<typeof capabilitiesResultSchema>;

/** The operation takes no path parameter, no query and no body. */
export const capabilitiesRequestSchema = z.strictObject({});

export const capabilitiesResponseSchema = dataEnvelope(capabilitiesResultSchema);

/** C-OPS-PORTAL-065 — GET /api/ops/capabilities */
export const CapabilitiesOperation: OpsOperation<
  typeof capabilitiesRequestSchema,
  typeof capabilitiesResponseSchema
> = Object.freeze({
  contractId: 'C-OPS-PORTAL-065',
  method: 'GET',
  path: '/api/ops/capabilities',
  request: capabilitiesRequestSchema,
  response: capabilitiesResponseSchema,
  success: 200,
  errors: [400, 401, 403, 429, 500],
});
