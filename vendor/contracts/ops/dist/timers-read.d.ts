/**
 * OPS-080 — C-OPS-PORTAL-070 `GET /api/config/section-timers`.
 *
 * ONE portable definition of the global per-section timer read, imported by the
 * Strapi projection, the ops web query and both HTTP suites so the wire shape
 * cannot drift. Pure TypeScript + Zod; nothing server-only may enter this file.
 *
 * The observed baseline (C-TMR-01, task 62) is preserved verbatim: the response
 * carries `stage` and `duration_seconds`, never labels and never minutes. The
 * minute helpers below exist because the OPS console EDITS whole minutes while
 * the wire stays in seconds — the conversion is contract knowledge, so both
 * sides derive it from here instead of each dividing by 60 their own way.
 */
import { z } from 'zod';
import { type OpsOperation } from './core';
/** The global test has exactly three sections, and they are stages 1, 2 and 3. */
export declare const TIMER_STAGES: readonly [1, 2, 3];
export declare const TIMER_SECTION_COUNT: 3;
/** Contracted wire bounds for one section (OpenAPI `TimerSection`). */
export declare const TIMER_DURATION_MIN_SECONDS = 60;
export declare const TIMER_DURATION_MAX_SECONDS = 3600;
/** The whole-minute range the ops console edits — 60s..3600s expressed in minutes. */
export declare const TIMER_MINUTES_MIN = 1;
export declare const TIMER_MINUTES_MAX = 60;
export declare const timerStageSchema: z.ZodUnion<readonly [z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>;
export type TimerStage = z.infer<typeof timerStageSchema>;
/** Strict: a section that smuggles a `label`, a `minutes` or an id fails the parse. */
export declare const timerSectionSchema: z.ZodObject<{
    stage: z.ZodUnion<readonly [z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>;
    duration_seconds: z.ZodNumber;
}, z.core.$strict>;
export type TimerSection = z.infer<typeof timerSectionSchema>;
/**
 * The 200 body's `data`. Three sections is not enough on its own: two copies of
 * stage 1 and no stage 3 is still "length 3", and that is exactly the stored
 * shape the read has to refuse rather than render as a screen missing a row.
 */
export declare const sectionTimersSchema: z.ZodObject<{
    sections: z.ZodArray<z.ZodObject<{
        stage: z.ZodUnion<readonly [z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>;
        duration_seconds: z.ZodNumber;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type SectionTimers = z.infer<typeof sectionTimersSchema>;
/** C-OPS-PORTAL-070 takes no path, query or body — an empty object is the whole request. */
export declare const timersReadRequestSchema: z.ZodObject<{}, z.core.$strict>;
export declare const timersReadResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        sections: z.ZodArray<z.ZodObject<{
            stage: z.ZodUnion<readonly [z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>;
            duration_seconds: z.ZodNumber;
        }, z.core.$strict>>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type TimersReadResponse = z.infer<typeof timersReadResponseSchema>;
/** C-OPS-PORTAL-070 — GET /api/config/section-timers */
export declare const TimersReadOperation: OpsOperation<typeof timersReadRequestSchema, typeof timersReadResponseSchema>;
/**
 * Stored seconds → the whole minutes the console shows, or `null` when the
 * stored value cannot be shown as whole minutes in 1..60.
 *
 * `null` rather than a rounded number on purpose: 90 stored seconds is a real
 * state (the write contract only forbids it from 60..3600 bounds, not from
 * being 1.5 minutes), and silently rendering "2" would make the operator save a
 * value nobody chose. The caller shows the honest seconds and asks for a fix.
 */
export declare function timerMinutesFromSeconds(durationSeconds: number): number | null;
/** Whole console minutes → the seconds the wire carries. */
export declare function timerSecondsFromMinutes(minutes: number): number;
/** True when every section can be rendered as whole minutes in 1..60. */
export declare function isWholeMinuteSectionSet(sections: readonly TimerSection[]): boolean;
