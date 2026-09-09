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
import { type OpsOperation } from './core';
/** The two portal role types. `ops` writes; `ops_support` reads and exports. */
export declare const OPS_ROLE_TYPE = "ops";
export declare const OPS_SUPPORT_ROLE_TYPE = "ops_support";
export declare const opsPortalRoleSchema: z.ZodEnum<{
    ops: "ops";
    ops_support: "ops_support";
}>;
export type OpsPortalRole = z.infer<typeof opsPortalRoleSchema>;
export declare function isOpsPortalRole(value: unknown): value is OpsPortalRole;
/**
 * The five capability flags, exactly as the operation contract declares them.
 * Strict: an extra flag invented by one side fails the parse instead of being
 * silently ignored by the other.
 */
export declare const opsCapabilityFlagsSchema: z.ZodObject<{
    read: z.ZodBoolean;
    write: z.ZodBoolean;
    export: z.ZodBoolean;
    view_as_teacher: z.ZodBoolean;
    edit_self: z.ZodBoolean;
}, z.core.$strict>;
export type OpsCapabilityFlags = z.infer<typeof opsCapabilityFlagsSchema>;
/**
 * The role -> flags matrix. `edit_self` is true for BOTH roles: the self
 * profile is a personal account, and contract-rules.md names it as the one
 * explicit support write exception. `view_as_teacher` impersonates a real
 * teacher, so it stays with `ops` alone.
 */
export declare const OPS_PORTAL_CAPABILITIES: Readonly<Record<OpsPortalRole, OpsCapabilityFlags>>;
/** Flags for a portal role. Returns a fresh object so a caller cannot mutate the matrix. */
export declare function capabilitiesForRole(role: OpsPortalRole): OpsCapabilityFlags;
/**
 * The status page the pictured error screen links to
 * (mvp/ops/Ops Portal.dc.html:135 — "Status page", beside "Try again").
 *
 * It is DEPLOYMENT configuration, not content: an absolute http(s) URL supplied
 * by the release. `null` means the release did not configure one — an explicit
 * setup failure the portal must surface, never a licence to drop the control.
 */
export declare const statusPageUrlSchema: z.ZodPipe<z.ZodString, z.ZodURL>;
export declare const opsActorSchema: z.ZodObject<{
    documentId: z.ZodString;
    first_name: z.ZodNullable<z.ZodString>;
    last_name: z.ZodNullable<z.ZodString>;
    email: z.ZodPipe<z.ZodString, z.ZodEmail>;
    role: z.ZodEnum<{
        ops: "ops";
        ops_support: "ops_support";
    }>;
    updatedAt: z.ZodISODateTime;
}, z.core.$strict>;
export type OpsActor = z.infer<typeof opsActorSchema>;
export declare const capabilitiesResultSchema: z.ZodObject<{
    actor: z.ZodObject<{
        documentId: z.ZodString;
        first_name: z.ZodNullable<z.ZodString>;
        last_name: z.ZodNullable<z.ZodString>;
        email: z.ZodPipe<z.ZodString, z.ZodEmail>;
        role: z.ZodEnum<{
            ops: "ops";
            ops_support: "ops_support";
        }>;
        updatedAt: z.ZodISODateTime;
    }, z.core.$strict>;
    capabilities: z.ZodObject<{
        read: z.ZodBoolean;
        write: z.ZodBoolean;
        export: z.ZodBoolean;
        view_as_teacher: z.ZodBoolean;
        edit_self: z.ZodBoolean;
    }, z.core.$strict>;
    status_page_url: z.ZodNullable<z.ZodString>;
}, z.core.$strict>;
export type CapabilitiesResult = z.infer<typeof capabilitiesResultSchema>;
/** The operation takes no path parameter, no query and no body. */
export declare const capabilitiesRequestSchema: z.ZodObject<{}, z.core.$strict>;
export declare const capabilitiesResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        actor: z.ZodObject<{
            documentId: z.ZodString;
            first_name: z.ZodNullable<z.ZodString>;
            last_name: z.ZodNullable<z.ZodString>;
            email: z.ZodPipe<z.ZodString, z.ZodEmail>;
            role: z.ZodEnum<{
                ops: "ops";
                ops_support: "ops_support";
            }>;
            updatedAt: z.ZodISODateTime;
        }, z.core.$strict>;
        capabilities: z.ZodObject<{
            read: z.ZodBoolean;
            write: z.ZodBoolean;
            export: z.ZodBoolean;
            view_as_teacher: z.ZodBoolean;
            edit_self: z.ZodBoolean;
        }, z.core.$strict>;
        status_page_url: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>;
}, z.core.$strict>;
/** C-OPS-PORTAL-065 — GET /api/ops/capabilities */
export declare const CapabilitiesOperation: OpsOperation<typeof capabilitiesRequestSchema, typeof capabilitiesResponseSchema>;
