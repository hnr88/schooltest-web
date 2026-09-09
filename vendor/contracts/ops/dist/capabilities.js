"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapabilitiesOperation = exports.capabilitiesResponseSchema = exports.capabilitiesRequestSchema = exports.capabilitiesResultSchema = exports.opsActorSchema = exports.statusPageUrlSchema = exports.OPS_PORTAL_CAPABILITIES = exports.opsCapabilityFlagsSchema = exports.opsPortalRoleSchema = exports.OPS_SUPPORT_ROLE_TYPE = exports.OPS_ROLE_TYPE = void 0;
exports.isOpsPortalRole = isOpsPortalRole;
exports.capabilitiesForRole = capabilitiesForRole;
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
const zod_1 = require("zod");
const core_1 = require("./core");
const NAME_MAX = 100;
const EMAIL_MAX = 255;
const STATUS_PAGE_URL_MAX = 2048;
/** The two portal role types. `ops` writes; `ops_support` reads and exports. */
exports.OPS_ROLE_TYPE = 'ops';
exports.OPS_SUPPORT_ROLE_TYPE = 'ops_support';
exports.opsPortalRoleSchema = zod_1.z.enum([exports.OPS_ROLE_TYPE, exports.OPS_SUPPORT_ROLE_TYPE]);
function isOpsPortalRole(value) {
    return exports.opsPortalRoleSchema.safeParse(value).success;
}
/**
 * The five capability flags, exactly as the operation contract declares them.
 * Strict: an extra flag invented by one side fails the parse instead of being
 * silently ignored by the other.
 */
exports.opsCapabilityFlagsSchema = zod_1.z.strictObject({
    read: zod_1.z.boolean(),
    write: zod_1.z.boolean(),
    export: zod_1.z.boolean(),
    view_as_teacher: zod_1.z.boolean(),
    edit_self: zod_1.z.boolean(),
});
/**
 * The role -> flags matrix. `edit_self` is true for BOTH roles: the self
 * profile is a personal account, and contract-rules.md names it as the one
 * explicit support write exception. `view_as_teacher` impersonates a real
 * teacher, so it stays with `ops` alone.
 */
exports.OPS_PORTAL_CAPABILITIES = Object.freeze({
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
function capabilitiesForRole(role) {
    return { ...exports.OPS_PORTAL_CAPABILITIES[role] };
}
/**
 * The status page the pictured error screen links to
 * (mvp/ops/Ops Portal.dc.html:135 — "Status page", beside "Try again").
 *
 * It is DEPLOYMENT configuration, not content: an absolute http(s) URL supplied
 * by the release. `null` means the release did not configure one — an explicit
 * setup failure the portal must surface, never a licence to drop the control.
 */
exports.statusPageUrlSchema = zod_1.z
    .string()
    .trim()
    .min(1)
    .max(STATUS_PAGE_URL_MAX)
    .pipe(zod_1.z.url({ protocol: /^https?$/ }));
exports.opsActorSchema = zod_1.z.strictObject({
    documentId: core_1.documentIdSchema,
    first_name: zod_1.z.string().max(NAME_MAX).nullable(),
    last_name: zod_1.z.string().max(NAME_MAX).nullable(),
    email: zod_1.z.string().min(1).max(EMAIL_MAX).pipe(zod_1.z.email()),
    role: exports.opsPortalRoleSchema,
    updatedAt: zod_1.z.iso.datetime({ offset: true }),
});
exports.capabilitiesResultSchema = zod_1.z.strictObject({
    actor: exports.opsActorSchema,
    capabilities: exports.opsCapabilityFlagsSchema,
    status_page_url: zod_1.z.string().max(STATUS_PAGE_URL_MAX).nullable(),
});
/** The operation takes no path parameter, no query and no body. */
exports.capabilitiesRequestSchema = zod_1.z.strictObject({});
exports.capabilitiesResponseSchema = (0, core_1.dataEnvelope)(exports.capabilitiesResultSchema);
/** C-OPS-PORTAL-065 — GET /api/ops/capabilities */
exports.CapabilitiesOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-065',
    method: 'GET',
    path: '/api/ops/capabilities',
    request: exports.capabilitiesRequestSchema,
    response: exports.capabilitiesResponseSchema,
    success: 200,
    errors: [400, 401, 403, 429, 500],
});
