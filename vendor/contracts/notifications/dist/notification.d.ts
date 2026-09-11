import { z } from 'zod';
/** Taxonomy-authoritative: use server-side and in the parity spec. */
export declare const notificationRowSchema: z.ZodObject<{
    documentId: z.ZodString;
    eventType: z.ZodEnum<{
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
    category: z.ZodEnum<{
        account: "account";
        security: "security";
        children: "children";
        testActivity: "testActivity";
        testResults: "testResults";
    }>;
    title: z.ZodString;
    body: z.ZodNullable<z.ZodString>;
    priority: z.ZodEnum<{
        high: "high";
        medium: "medium";
        low: "low";
    }>;
    readAt: z.ZodNullable<z.ZodISODateTime>;
    linkUrl: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
}, z.core.$strict>;
export type NotificationRow = z.infer<typeof notificationRowSchema>;
/**
 * Client parse boundary: identical in every key EXCEPT that an unrecognised
 * event type is carried rather than rejected. See `event-types.ts` for why a
 * closed enum here is a bug, not extra safety.
 */
export declare const notificationRowWireSchema: z.ZodObject<{
    documentId: z.ZodString;
    eventType: z.ZodString;
    category: z.ZodEnum<{
        account: "account";
        security: "security";
        children: "children";
        testActivity: "testActivity";
        testResults: "testResults";
    }>;
    title: z.ZodString;
    body: z.ZodNullable<z.ZodString>;
    priority: z.ZodEnum<{
        high: "high";
        medium: "medium";
        low: "low";
    }>;
    readAt: z.ZodNullable<z.ZodISODateTime>;
    linkUrl: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
}, z.core.$strict>;
export type NotificationRowWire = z.infer<typeof notificationRowWireSchema>;
/** Inline pagination block — `page >= 1`, `pageSize` clamped to 100, computed `pageCount`. */
export declare const notificationPaginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
    pageCount: z.ZodNumber;
    total: z.ZodNumber;
}, z.core.$strict>;
/**
 * C-NOTIF-LIST envelope — `{ data, meta: { pagination, unreadCount } }`, where
 * `unreadCount` is the caller's TOTAL `readAt`-null count regardless of the
 * `read` / `category` / `eventType` / `q` filters applied to the page.
 */
export declare const notificationListSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        documentId: z.ZodString;
        eventType: z.ZodEnum<{
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
        category: z.ZodEnum<{
            account: "account";
            security: "security";
            children: "children";
            testActivity: "testActivity";
            testResults: "testResults";
        }>;
        title: z.ZodString;
        body: z.ZodNullable<z.ZodString>;
        priority: z.ZodEnum<{
            high: "high";
            medium: "medium";
            low: "low";
        }>;
        readAt: z.ZodNullable<z.ZodISODateTime>;
        linkUrl: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodISODateTime;
        updatedAt: z.ZodISODateTime;
    }, z.core.$strict>>;
    meta: z.ZodObject<{
        pagination: z.ZodObject<{
            page: z.ZodNumber;
            pageSize: z.ZodNumber;
            pageCount: z.ZodNumber;
            total: z.ZodNumber;
        }, z.core.$strict>;
        unreadCount: z.ZodNumber;
    }, z.core.$strict>;
}, z.core.$strict>;
export type NotificationListEnvelope = z.infer<typeof notificationListSchema>;
export declare const notificationListWireSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        documentId: z.ZodString;
        eventType: z.ZodString;
        category: z.ZodEnum<{
            account: "account";
            security: "security";
            children: "children";
            testActivity: "testActivity";
            testResults: "testResults";
        }>;
        title: z.ZodString;
        body: z.ZodNullable<z.ZodString>;
        priority: z.ZodEnum<{
            high: "high";
            medium: "medium";
            low: "low";
        }>;
        readAt: z.ZodNullable<z.ZodISODateTime>;
        linkUrl: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodISODateTime;
        updatedAt: z.ZodISODateTime;
    }, z.core.$strict>>;
    meta: z.ZodObject<{
        pagination: z.ZodObject<{
            page: z.ZodNumber;
            pageSize: z.ZodNumber;
            pageCount: z.ZodNumber;
            total: z.ZodNumber;
        }, z.core.$strict>;
        unreadCount: z.ZodNumber;
    }, z.core.$strict>;
}, z.core.$strict>;
/** C-NOTIF-UNREAD-COUNT — `GET /api/notifications/unread-count`: the badge poll. */
export declare const notificationUnreadCountSchema: z.ZodObject<{
    data: z.ZodObject<{
        count: z.ZodNumber;
    }, z.core.$strict>;
}, z.core.$strict>;
/**
 * The read surface's query params. Row 09 added `q` and `sort` so the parent
 * feed could page on the SERVER without losing the search and date sort it
 * already shipped client-side.
 */
export declare const notificationListParamsSchema: z.ZodObject<{
    page: z.ZodNumber;
    pageSize: z.ZodNumber;
    read: z.ZodOptional<z.ZodBoolean>;
    category: z.ZodOptional<z.ZodEnum<{
        account: "account";
        security: "security";
        children: "children";
        testActivity: "testActivity";
        testResults: "testResults";
    }>>;
    eventType: z.ZodOptional<z.ZodString>;
    q: z.ZodOptional<z.ZodString>;
    sort: z.ZodOptional<z.ZodEnum<{
        "date:asc": "date:asc";
        "date:desc": "date:desc";
    }>>;
}, z.core.$strict>;
/**
 * C-NOT-01 — the school-staff feed's projection lives in `./school-feed`, so
 * the parent feed's row and the staff projection sit beside each other in the
 * package and neither copy can drift (row 08: one reader, two projections).
 */
/** C-NOTIF-READ — `PUT /api/notifications/{documentId}/read`: idempotent, so an
 * already-read row answers its ORIGINAL `readAt`. */
export declare const notificationMarkReadSchema: z.ZodObject<{
    data: z.ZodObject<{
        documentId: z.ZodString;
        readAt: z.ZodISODateTime;
    }, z.core.$strict>;
}, z.core.$strict>;
/** C-NOTIF-READ-ALL — `POST /api/notifications/read-all`: bounded batch <= 100; 0 unread => `{ updated: 0 }`. */
export declare const notificationMarkAllSchema: z.ZodObject<{
    data: z.ZodObject<{
        updated: z.ZodNumber;
    }, z.core.$strict>;
}, z.core.$strict>;
