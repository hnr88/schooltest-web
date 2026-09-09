"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGACY_PLAN_TO_PORTAL_PLAN = exports.PORTAL_PLAN_TO_LEGACY_PLAN = void 0;
exports.derivePortalPlan = derivePortalPlan;
/** portal_plan -> legacy entitlement plan (one documented compatibility mapping). */
exports.PORTAL_PLAN_TO_LEGACY_PLAN = Object.freeze({
    pilot: 'trial',
    standard: 'full_license',
    enterprise: 'full_license',
});
/**
 * Derive the portal tier from a legacy plan row that has no stored tier yet.
 * The inverse of the mapping above is NOT symmetric by design: standard and
 * enterprise BOTH map to full_license, so a full_license row derives to
 * `standard` — the decision text says exactly that, and upgrading a school to
 * enterprise is an explicit ops action, not a default.
 */
exports.LEGACY_PLAN_TO_PORTAL_PLAN = Object.freeze({
    trial: 'pilot',
    full_license: 'standard',
});
/** Server-side derivation rule a backfill or a read path calls directly. */
function derivePortalPlan(legacyPlan, storedPortalPlan) {
    if (storedPortalPlan)
        return storedPortalPlan;
    return exports.LEGACY_PLAN_TO_PORTAL_PLAN[legacyPlan];
}
