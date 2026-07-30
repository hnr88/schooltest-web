import { z } from 'zod';

// C-TMR-01 (task 68, st-mvp-pivot): the global per-section timer set — one
// entry per section, seconds on the wire, minutes in the UI.

export const timerSectionSchema = z.object({
  stage: z.number().int(),
  duration_seconds: z.number().int().positive(),
});

export type TimerSection = z.infer<typeof timerSectionSchema>;

// C-TMR-01 GET/PUT payload (`{ data: { sections } }`).
export const sectionTimersSchema = z.object({
  sections: z.array(timerSectionSchema).min(1),
});

export type SectionTimers = z.infer<typeof sectionTimersSchema>;

// Active Config row via its core find (ops holds the CONFIG read grant) — the
// who/when/version metadata the contract GET deliberately does not carry.
export const sectionTimersMetaSchema = z.object({
  version: z.number(),
  section_timers: z.object({
    updated_by: z.string(),
    updated_at: z.string(),
  }),
});

export type SectionTimersMeta = z.infer<typeof sectionTimersMetaSchema>;

// Ops timers form (mvp-updates 4.2: tuned during the pilot, so the UI carries
// no defaults): whole minutes 1..60, matching the 60..3600 second wire range.
// The inputs register with valueAsNumber, so a blank field arrives as NaN and
// the type-level error carries the same translated range message.
export function createSectionTimersFormSchema(tv: (key: string) => string) {
  const minutes = z
    .number({ error: tv('range') })
    .int(tv('range'))
    .min(1, tv('range'))
    .max(60, tv('range'));
  return z.object({ section1: minutes, section2: minutes, section3: minutes });
}

export type SectionTimersFormValues = z.infer<
  ReturnType<typeof createSectionTimersFormSchema>
>;
