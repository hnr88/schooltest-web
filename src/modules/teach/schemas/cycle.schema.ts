import { z } from 'zod';

// Boundary schema for the C-TEACH-02 class cycle payload (task 108).
// Defensive parsing at the query boundary; the UI consumes ClassCycle from
// types/cycle.types.ts.
export const classCycleSchema = z.object({
  live_form: z.object({ documentId: z.string(), form_code: z.string() }).nullable(),
  window: z.object({ opens_at: z.string(), closes_at: z.string() }).nullable(),
  position: z.enum(['test_a', 'test_b', 'unscheduled']),
  benchmark_form: z.string().nullable(),
  progress_form: z.string().nullable(),
});
