"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimersReadOperation = exports.timersReadResponseSchema = exports.timersReadRequestSchema = exports.sectionTimersSchema = exports.timerSectionSchema = exports.timerStageSchema = exports.TIMER_MINUTES_MAX = exports.TIMER_MINUTES_MIN = exports.TIMER_DURATION_MAX_SECONDS = exports.TIMER_DURATION_MIN_SECONDS = exports.TIMER_SECTION_COUNT = exports.TIMER_STAGES = void 0;
exports.timerMinutesFromSeconds = timerMinutesFromSeconds;
exports.timerSecondsFromMinutes = timerSecondsFromMinutes;
exports.isWholeMinuteSectionSet = isWholeMinuteSectionSet;
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
const zod_1 = require("zod");
const core_1 = require("./core");
/** The global test has exactly three sections, and they are stages 1, 2 and 3. */
exports.TIMER_STAGES = [1, 2, 3];
exports.TIMER_SECTION_COUNT = exports.TIMER_STAGES.length;
/** Contracted wire bounds for one section (OpenAPI `TimerSection`). */
exports.TIMER_DURATION_MIN_SECONDS = 60;
exports.TIMER_DURATION_MAX_SECONDS = 3600;
/** The whole-minute range the ops console edits — 60s..3600s expressed in minutes. */
exports.TIMER_MINUTES_MIN = 1;
exports.TIMER_MINUTES_MAX = 60;
const SECONDS_PER_MINUTE = 60;
exports.timerStageSchema = zod_1.z.union([zod_1.z.literal(1), zod_1.z.literal(2), zod_1.z.literal(3)]);
/** Strict: a section that smuggles a `label`, a `minutes` or an id fails the parse. */
exports.timerSectionSchema = zod_1.z.strictObject({
    stage: exports.timerStageSchema,
    duration_seconds: zod_1.z
        .number()
        .int()
        .min(exports.TIMER_DURATION_MIN_SECONDS)
        .max(exports.TIMER_DURATION_MAX_SECONDS),
});
/**
 * The 200 body's `data`. Three sections is not enough on its own: two copies of
 * stage 1 and no stage 3 is still "length 3", and that is exactly the stored
 * shape the read has to refuse rather than render as a screen missing a row.
 */
exports.sectionTimersSchema = zod_1.z
    .strictObject({ sections: zod_1.z.array(exports.timerSectionSchema).length(exports.TIMER_SECTION_COUNT) })
    .superRefine((value, ctx) => {
    const seen = value.sections.map((section) => section.stage).sort((a, b) => a - b);
    if (seen.join(',') !== exports.TIMER_STAGES.join(',')) {
        ctx.addIssue({
            code: 'custom',
            path: ['sections'],
            message: 'sections must cover stages 1, 2 and 3 exactly once',
        });
    }
});
/** C-OPS-PORTAL-070 takes no path, query or body — an empty object is the whole request. */
exports.timersReadRequestSchema = zod_1.z.strictObject({});
exports.timersReadResponseSchema = (0, core_1.dataEnvelope)(exports.sectionTimersSchema);
/** C-OPS-PORTAL-070 — GET /api/config/section-timers */
exports.TimersReadOperation = Object.freeze({
    contractId: 'C-OPS-PORTAL-070',
    method: 'GET',
    path: '/api/config/section-timers',
    request: exports.timersReadRequestSchema,
    response: exports.timersReadResponseSchema,
    success: 200,
    errors: [400, 401, 403, 404, 429, 500],
});
/**
 * Stored seconds → the whole minutes the console shows, or `null` when the
 * stored value cannot be shown as whole minutes in 1..60.
 *
 * `null` rather than a rounded number on purpose: 90 stored seconds is a real
 * state (the write contract only forbids it from 60..3600 bounds, not from
 * being 1.5 minutes), and silently rendering "2" would make the operator save a
 * value nobody chose. The caller shows the honest seconds and asks for a fix.
 */
function timerMinutesFromSeconds(durationSeconds) {
    if (!Number.isInteger(durationSeconds))
        return null;
    if (durationSeconds % SECONDS_PER_MINUTE !== 0)
        return null;
    const minutes = durationSeconds / SECONDS_PER_MINUTE;
    return minutes >= exports.TIMER_MINUTES_MIN && minutes <= exports.TIMER_MINUTES_MAX ? minutes : null;
}
/** Whole console minutes → the seconds the wire carries. */
function timerSecondsFromMinutes(minutes) {
    return minutes * SECONDS_PER_MINUTE;
}
/** True when every section can be rendered as whole minutes in 1..60. */
function isWholeMinuteSectionSet(sections) {
    return sections.every((section) => timerMinutesFromSeconds(section.duration_seconds) !== null);
}
