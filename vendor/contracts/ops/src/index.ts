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

/* --- task 01 additions (backlog 01, contracts + five schema decisions) --- */
export * from './roster-list';
export * from './ownership';
export * from './plan-compat';
export * from './result-windows';
export * from './import-receipts';

/* --- task 10 addition: the versioned school EDIT contract --- */
export * from './school-patch';

/* --- task 29 addition: the window report and its PDF export --- */
export * from './window-report';

/* --- task 12 additions (school lifecycle: archive, restore, undo) --- */
export * from './school-lifecycle';

/* --- integrator: canonical re-exports --- */
// Several operation modules independently declared the same domain enums while
// their authors worked in parallel. The definitions are VALUE-IDENTICAL (verified:
// Sector = government|non-government|catholic; PortalPlan = pilot|standard|enterprise;
// PortalStatus = active|trial|pending_setup|suspended|archived;
// SCHOOL_ARCHIVED_ACCOUNT_STATUS = 'closed'), so this is duplication, not a contract
// conflict. `export *` cannot pick between them (TS2308), so one source is named
// canonical here. DEBT: these belong in a single common module and the duplicate
// declarations should be deleted from the operation modules.
export type { AustralianState, Sector, PortalPlan, PortalStatus, SchoolPlan, SchoolType } from './school-create';
export { SCHOOL_ARCHIVED_ACCOUNT_STATUS } from './school-suspend';
export { australianStateSchema, sectorSchema, portalPlanSchema, portalStatusSchema, schoolPlanSchema, schoolTypeSchema } from './school-create';

/* --- ledger 6: the audit console (ledger + API tokens) --- */
export * from './audit-console';

/* --- ledger 7: the comms console (templates, email log, bulk email, push) --- */
export * from './comms-console';

/* --- ledger 9: the flags console (registry toggle + the three settings actions) --- */
export * from './flags-console';

/* --- ledger 11 / D-007: the C-OPS-04 inspection surfaces (form Q-matrix +
   keys, responses.csv, the audited view-as-teacher read) --- */
export * from './inspection';

/* --- ledger 10 / D-008: the ops legal-document editor (C-LEG-02 read +
   C-LEG-03 ops write) --- */
export * from './legal-documents';
