import { z } from 'zod';
/**
 * C-PREF-GET / C-PREF-UPDATE — `/api/notification-preferences/me`.
 *
 * Row 02 (D-05): this shape had NO Zod anywhere. It was documented in markdown
 * on two boards, with `mvp/desktop-app/contracts/notifications.md` recording
 * "no Zod, and none is added" — while both clients wrote it by hand.
 *
 * Composed from named parts rather than one flat object so row 04's per-event
 * map sits BESIDE the channels and the digest instead of being spliced into a
 * literal that three files would then re-copy.
 */
export declare const notificationDigestFrequencySchema: z.ZodEnum<{
    immediate: "immediate";
    daily: "daily";
    weekly: "weekly";
    off: "off";
}>;
export type NotificationDigestFrequency = z.infer<typeof notificationDigestFrequencySchema>;
/** The global master per transport. Per-event says WHETHER; these say HOW. */
export declare const notificationChannelsSchema: z.ZodObject<{
    emailEnabled: z.ZodBoolean;
    smsEnabled: z.ZodBoolean;
    inAppEnabled: z.ZodBoolean;
    pushEnabled: z.ZodBoolean;
}, z.core.$strip>;
/**
 * Row 04 (D-01) — the per-event map. Only suppressible events appear;
 * account/security carry no key and cannot be switched off in any layer.
 */
export declare const notificationEventPreferencesSchema: z.ZodObject<{
    student_created: z.ZodBoolean;
    student_email_fix_requested: z.ZodBoolean;
    session_started: z.ZodBoolean;
    session_completed: z.ZodBoolean;
    test_results_ready: z.ZodBoolean;
    test_results_updated: z.ZodBoolean;
}, z.core.$strip>;
/**
 * The DERIVED bulk control. Each category is recomputed server-side as the AND
 * over its events and is written by nothing else (row 04's one-authority rule),
 * so a client that submits both would be a second writer racing for one column.
 */
export declare const notificationCategoryFlagsSchema: z.ZodObject<{
    children: z.ZodBoolean;
    testActivity: z.ZodBoolean;
    testResults: z.ZodBoolean;
}, z.core.$strip>;
/** Locked on, in every layer. */
export declare const notificationLockedFlagsSchema: z.ZodObject<{
    account: z.ZodBoolean;
    security: z.ZodBoolean;
}, z.core.$strip>;
/** What the server returns. `eventPreferences` is null for an un-swept row. */
export declare const notificationPreferenceSchema: z.ZodObject<{
    emailEnabled: z.ZodBoolean;
    smsEnabled: z.ZodBoolean;
    inAppEnabled: z.ZodBoolean;
    pushEnabled: z.ZodBoolean;
    children: z.ZodBoolean;
    testActivity: z.ZodBoolean;
    testResults: z.ZodBoolean;
    account: z.ZodBoolean;
    security: z.ZodBoolean;
    documentId: z.ZodString;
    digestFrequency: z.ZodEnum<{
        immediate: "immediate";
        daily: "daily";
        weekly: "weekly";
        off: "off";
    }>;
    eventPreferences: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodBoolean>>;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
}, z.core.$strip>;
export type NotificationPreference = z.infer<typeof notificationPreferenceSchema>;
export declare const notificationPreferenceResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        emailEnabled: z.ZodBoolean;
        smsEnabled: z.ZodBoolean;
        inAppEnabled: z.ZodBoolean;
        pushEnabled: z.ZodBoolean;
        children: z.ZodBoolean;
        testActivity: z.ZodBoolean;
        testResults: z.ZodBoolean;
        account: z.ZodBoolean;
        security: z.ZodBoolean;
        documentId: z.ZodString;
        digestFrequency: z.ZodEnum<{
            immediate: "immediate";
            daily: "daily";
            weekly: "weekly";
            off: "off";
        }>;
        eventPreferences: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodBoolean>>;
        createdAt: z.ZodISODateTime;
        updatedAt: z.ZodISODateTime;
    }, z.core.$strip>;
}, z.core.$strict>;
/**
 * The PUT body. A NON-STRICT partial, deliberately: the server IGNORES unknown
 * keys and answers 200, so a strict schema here would turn a working request
 * into a 400 the API never raises. Every field optional — the handler applies
 * only what it is sent.
 */
export declare const notificationPreferenceUpdateSchema: z.ZodObject<{
    emailEnabled: z.ZodOptional<z.ZodBoolean>;
    smsEnabled: z.ZodOptional<z.ZodBoolean>;
    inAppEnabled: z.ZodOptional<z.ZodBoolean>;
    pushEnabled: z.ZodOptional<z.ZodBoolean>;
    children: z.ZodOptional<z.ZodBoolean>;
    testActivity: z.ZodOptional<z.ZodBoolean>;
    testResults: z.ZodOptional<z.ZodBoolean>;
    digestFrequency: z.ZodOptional<z.ZodEnum<{
        immediate: "immediate";
        daily: "daily";
        weekly: "weekly";
        off: "off";
    }>>;
    eventPreferences: z.ZodOptional<z.ZodObject<{
        student_created: z.ZodOptional<z.ZodBoolean>;
        student_email_fix_requested: z.ZodOptional<z.ZodBoolean>;
        session_started: z.ZodOptional<z.ZodBoolean>;
        session_completed: z.ZodOptional<z.ZodBoolean>;
        test_results_ready: z.ZodOptional<z.ZodBoolean>;
        test_results_updated: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type NotificationPreferenceUpdate = z.infer<typeof notificationPreferenceUpdateSchema>;
