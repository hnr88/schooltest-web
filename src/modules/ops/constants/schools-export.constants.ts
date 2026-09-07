/**
 * C-OPS-PORTAL-009 (OPS-019) — the schools-export vocabulary.
 *
 * SOURCE OF TRUTH: `mvp/contracts/ops/src/schools-export.ts`. These values are
 * that module's, mirrored here ONLY because the `@schooltest/ops-contracts`
 * build installed in this repo predates the new module, so
 * `import { ... } from '@schooltest/ops-contracts'` cannot resolve it yet. Once
 * the integrator adds `export * from './schools-export'` to the package index
 * and reinstalls, this file is deleted and replaced by:
 *
 *   export {
 *     SCHOOLS_EXPORT_MAX_SELECTION, SCHOOLS_EXPORT_PATH,
 *   } from '@schooltest/ops-contracts';
 */
export const PORTAL_SCHOOL_STATUSES = [
  'active',
  'trial',
  'pending_setup',
  'suspended',
  'archived',
] as const;

export const PORTAL_SCHOOL_PLANS = ['pilot', 'standard', 'enterprise'] as const;

export const OPS_SCHOOL_STATES = ['VIC', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'] as const;

export const OPS_SCHOOL_SECTORS = ['government', 'non-government', 'catholic'] as const;

export const OPS_SCHOOLS_EXPORT_SORTS = [
  'name:asc',
  'student_count:desc',
  'createdAt:desc',
  'last_active_at:desc',
] as const;

export const OPS_SCHOOLS_EXPORT_PATH = '/api/ops/schools/export.csv';

export const OPS_SCHOOLS_EXPORT_MAX_SELECTION = 200;

export const OPS_SCHOOLS_EXPORT_QUERY_MAX = 120;

/** Fallback only — the real name comes from the response Content-Disposition. */
export const OPS_SCHOOLS_EXPORT_FALLBACK_FILENAME = 'schools.csv';

export const OPS_SCHOOLS_EXPORT_QUERY_KEY = ['ops', 'schools-export'] as const;
