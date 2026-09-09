/**
 * Package entry point.
 *
 * The primitives live in ./core, NOT here, and every operation module imports
 * from './core'. That is deliberate: when the primitives lived in this file and
 * each module imported back from './core', the package formed a CommonJS import
 * cycle. It resolved lazily in most callers but NOT during Strapi's synchronous
 * config load, where the half-initialised module yielded undefined and crashed
 * config/middlewares.ts with "Cannot read properties of undefined (reading
 * 'nullable')". Keep ./core free of local imports so the cycle cannot come back.
 */
export * from './core';
export * from './rest-boundary';
export * from './compatibility';
export * from './capabilities';
export * from './classes-list';
export * from './import-template';
export * from './school-suspend';
export * from './settings-read';
export * from './staff-invitations';
export * from './staff-users';
export * from './students-list';
export * from './teachers-list';
export * from './onboarding-read';
export * from './school-create';
export * from './sitting-invalidate';
export * from './schools-export';
export * from './schools-list';
export * from './timers-read';
export * from './system';
export * from './content';
export * from './form-window-read';
export * from './school-activity';
export * from './school-detail';
export * from './roster-list';
export * from './ownership';
export * from './plan-compat';
export * from './result-windows';
export * from './import-receipts';
export * from './school-patch';
export * from './window-report';
export * from './school-lifecycle';
export type { AustralianState, Sector, PortalPlan, PortalStatus, SchoolPlan, SchoolType } from './school-create';
export { SCHOOL_ARCHIVED_ACCOUNT_STATUS } from './school-suspend';
export { australianStateSchema, sectorSchema, portalPlanSchema, portalStatusSchema, schoolPlanSchema, schoolTypeSchema } from './school-create';
export * from './audit-console';
export * from './comms-console';
export * from './flags-console';
export * from './inspection';
export * from './legal-documents';
