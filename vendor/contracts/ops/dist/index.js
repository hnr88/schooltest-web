"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schoolTypeSchema = exports.schoolPlanSchema = exports.portalStatusSchema = exports.portalPlanSchema = exports.sectorSchema = exports.australianStateSchema = exports.SCHOOL_ARCHIVED_ACCOUNT_STATUS = void 0;
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
__exportStar(require("./core"), exports);
__exportStar(require("./rest-boundary"), exports);
__exportStar(require("./compatibility"), exports);
__exportStar(require("./capabilities"), exports);
__exportStar(require("./classes-list"), exports);
__exportStar(require("./import-template"), exports);
__exportStar(require("./school-suspend"), exports);
__exportStar(require("./settings-read"), exports);
__exportStar(require("./staff-invitations"), exports);
__exportStar(require("./staff-users"), exports);
__exportStar(require("./students-list"), exports);
__exportStar(require("./teachers-list"), exports);
__exportStar(require("./onboarding-read"), exports);
__exportStar(require("./school-create"), exports);
__exportStar(require("./sitting-invalidate"), exports);
__exportStar(require("./schools-export"), exports);
__exportStar(require("./schools-list"), exports);
__exportStar(require("./timers-read"), exports);
__exportStar(require("./system"), exports);
__exportStar(require("./content"), exports);
__exportStar(require("./form-window-read"), exports);
__exportStar(require("./school-activity"), exports);
__exportStar(require("./school-detail"), exports);
/* --- task 01 additions (backlog 01, contracts + five schema decisions) --- */
__exportStar(require("./roster-list"), exports);
__exportStar(require("./ownership"), exports);
__exportStar(require("./plan-compat"), exports);
__exportStar(require("./result-windows"), exports);
__exportStar(require("./import-receipts"), exports);
/* --- task 10 addition: the versioned school EDIT contract --- */
__exportStar(require("./school-patch"), exports);
/* --- task 29 addition: the window report and its PDF export --- */
__exportStar(require("./window-report"), exports);
/* --- task 12 additions (school lifecycle: archive, restore, undo) --- */
__exportStar(require("./school-lifecycle"), exports);
var school_suspend_1 = require("./school-suspend");
Object.defineProperty(exports, "SCHOOL_ARCHIVED_ACCOUNT_STATUS", { enumerable: true, get: function () { return school_suspend_1.SCHOOL_ARCHIVED_ACCOUNT_STATUS; } });
var school_create_1 = require("./school-create");
Object.defineProperty(exports, "australianStateSchema", { enumerable: true, get: function () { return school_create_1.australianStateSchema; } });
Object.defineProperty(exports, "sectorSchema", { enumerable: true, get: function () { return school_create_1.sectorSchema; } });
Object.defineProperty(exports, "portalPlanSchema", { enumerable: true, get: function () { return school_create_1.portalPlanSchema; } });
Object.defineProperty(exports, "portalStatusSchema", { enumerable: true, get: function () { return school_create_1.portalStatusSchema; } });
Object.defineProperty(exports, "schoolPlanSchema", { enumerable: true, get: function () { return school_create_1.schoolPlanSchema; } });
Object.defineProperty(exports, "schoolTypeSchema", { enumerable: true, get: function () { return school_create_1.schoolTypeSchema; } });
/* --- ledger 6: the audit console (ledger + API tokens) --- */
__exportStar(require("./audit-console"), exports);
/* --- ledger 7: the comms console (templates, email log, bulk email, push) --- */
__exportStar(require("./comms-console"), exports);
/* --- ledger 9: the flags console (registry toggle + the three settings actions) --- */
__exportStar(require("./flags-console"), exports);
/* --- ledger 11 / D-007: the C-OPS-04 inspection surfaces (form Q-matrix +
   keys, responses.csv, the audited view-as-teacher read) --- */
__exportStar(require("./inspection"), exports);
/* --- ledger 10 / D-008: the ops legal-document editor (C-LEG-02 read +
   C-LEG-03 ops write) --- */
__exportStar(require("./legal-documents"), exports);
