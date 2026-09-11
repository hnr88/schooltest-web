"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPRESSIBLE_EVENT_KEYS = exports.notificationPrioritySchema = exports.notificationCategorySchema = exports.notificationEventTypeWireSchema = exports.notificationEventTypeSchema = void 0;
const zod_1 = require("zod");
/**
 * THE notification event taxonomy — one declaration, three consumers.
 *
 * mvp/notifications row 02 (D-05). Before this package the same list existed
 * FOUR times in source: the API contract, the desktop's strict mirror, the
 * hand-typed OpenAPI enum, and the content-type `schema.json`. The web typed
 * the same field as an open `z.string()`, so the three that were closed could
 * disagree with each other and with the one that was not.
 *
 * The order is the `schema.json` enum order and is LOAD-BEARING: that enum
 * backs a database column and is append-only, so a reorder would rewrite a
 * column constraint. `schooltest-api/tests/unit/notification-event-registry.spec.ts`
 * deep-equals this list against all the authored surfaces, in order, and fails
 * in either direction.
 */
exports.notificationEventTypeSchema = zod_1.z.enum([
    'account_email_confirmed',
    'security_password_reset_requested',
    'security_password_reset_completed',
    'security_password_changed',
    'student_created',
    'student_email_fix_requested',
    'session_started',
    'session_completed',
    'test_results_ready',
    'test_results_updated',
    'sitting_scheduled',
    'device_setup_reminder',
    'assessment_window_opened',
    'assessment_window_report_shared',
    'assessment_window_cancelled',
    'result_scoring_failed',
    'report_recalled',
    'school_suspended',
    'school_archived',
    'school_reinstated',
    'class_teacher_assigned',
    'sitting_session_terminated',
]);
/**
 * The LENIENT variant, for a client parse boundary.
 *
 * Both are exported deliberately rather than one winning. A closed enum is
 * right where this package is the taxonomy authority (the API's own response
 * parse, the parity spec). It is WRONG at a client parse boundary: a client
 * running an older bundle against a newer server would reject the whole row —
 * including its title and body — over an event type it merely does not
 * recognise yet. That is a worse failure than rendering an unknown type with a
 * fallback icon.
 *
 * The desktop previously used the closed enum here and this is exactly what bit
 * it: its strict mirror sat at 12 values while the server had grown to 22, so
 * `notificationListSchema.parse` rejected every row carrying a newer type.
 */
exports.notificationEventTypeWireSchema = zod_1.z.string().min(1);
exports.notificationCategorySchema = zod_1.z.enum([
    'account',
    'security',
    'children',
    'testActivity',
    'testResults',
]);
exports.notificationPrioritySchema = zod_1.z.enum(['high', 'medium', 'low']);
/**
 * The events a user may switch off. account/security carry no key and can never
 * be switched off in any layer (row 04, D-01) — they are absent here by
 * construction, not by a runtime check.
 */
exports.SUPPRESSIBLE_EVENT_KEYS = [
    'test_results_ready',
    'test_results_updated',
    'session_completed',
    'session_started',
    'student_created',
    'student_email_fix_requested',
];
