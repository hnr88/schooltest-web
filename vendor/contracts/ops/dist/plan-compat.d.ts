/**
 * D-PLAN — the HTML commercial tiers beside the legacy entitlement plans
 * (backlog task 01).
 *
 * `portal_plan` (pilot | standard | enterprise) is the portal tier the ops UI
 * renders; the legacy entitlement `plan` (trial | full_license) keeps driving
 * EXISTING quotas. The compatibility policy is the ONE documented mapping:
 *
 *   pilot      -> trial
 *   standard   -> full_license
 *   enterprise -> full_license
 *
 * Rows derive their tier from the legacy plan ONLY when no explicit portal
 * tier is stored (migration 2026.09.05T02.01.00.owner-backfill.js documents
 * and applies the derivation). Existing per-school quotas are kept untouched:
 * `full_license` stays "Configurable — assigned by Ops" (see
 * schooltest-api/src/api/entitlement/lib/plan.constants.ts), so NO Enterprise
 * quota is invented here. The new UI submits portal_plan; the legacy plan
 * remains available and unchanged for existing consumers.
 */
import type { PortalPlan } from './school-create';
import type { SchoolPlan } from './school-create';
/** portal_plan -> legacy entitlement plan (one documented compatibility mapping). */
export declare const PORTAL_PLAN_TO_LEGACY_PLAN: Readonly<Record<PortalPlan, SchoolPlan>>;
/**
 * Derive the portal tier from a legacy plan row that has no stored tier yet.
 * The inverse of the mapping above is NOT symmetric by design: standard and
 * enterprise BOTH map to full_license, so a full_license row derives to
 * `standard` — the decision text says exactly that, and upgrading a school to
 * enterprise is an explicit ops action, not a default.
 */
export declare const LEGACY_PLAN_TO_PORTAL_PLAN: Readonly<Record<SchoolPlan, PortalPlan>>;
/** Server-side derivation rule a backfill or a read path calls directly. */
export declare function derivePortalPlan(legacyPlan: SchoolPlan, storedPortalPlan?: PortalPlan | null): PortalPlan;
