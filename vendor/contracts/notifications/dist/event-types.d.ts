import { z } from 'zod';
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
export declare const notificationEventTypeSchema: z.ZodEnum<{
    account_email_confirmed: "account_email_confirmed";
    security_password_reset_requested: "security_password_reset_requested";
    security_password_reset_completed: "security_password_reset_completed";
    security_password_changed: "security_password_changed";
    student_created: "student_created";
    student_email_fix_requested: "student_email_fix_requested";
    session_started: "session_started";
    session_completed: "session_completed";
    test_results_ready: "test_results_ready";
    test_results_updated: "test_results_updated";
    sitting_scheduled: "sitting_scheduled";
    device_setup_reminder: "device_setup_reminder";
    assessment_window_opened: "assessment_window_opened";
    assessment_window_report_shared: "assessment_window_report_shared";
    assessment_window_cancelled: "assessment_window_cancelled";
    result_scoring_failed: "result_scoring_failed";
    report_recalled: "report_recalled";
    school_suspended: "school_suspended";
    school_archived: "school_archived";
    school_reinstated: "school_reinstated";
    class_teacher_assigned: "class_teacher_assigned";
    sitting_session_terminated: "sitting_session_terminated";
}>;
export type NotificationEventType = z.infer<typeof notificationEventTypeSchema>;
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
export declare const notificationEventTypeWireSchema: z.ZodString;
export declare const notificationCategorySchema: z.ZodEnum<{
    account: "account";
    security: "security";
    children: "children";
    testActivity: "testActivity";
    testResults: "testResults";
}>;
export type NotificationCategory = z.infer<typeof notificationCategorySchema>;
export declare const notificationPrioritySchema: z.ZodEnum<{
    high: "high";
    medium: "medium";
    low: "low";
}>;
export type NotificationPriority = z.infer<typeof notificationPrioritySchema>;
/**
 * The events a user may switch off. account/security carry no key and can never
 * be switched off in any layer (row 04, D-01) — they are absent here by
 * construction, not by a runtime check.
 */
export declare const SUPPRESSIBLE_EVENT_KEYS: readonly ["test_results_ready", "test_results_updated", "session_completed", "session_started", "student_created", "student_email_fix_requested"];
export type SuppressibleEventKey = (typeof SUPPRESSIBLE_EVENT_KEYS)[number];
