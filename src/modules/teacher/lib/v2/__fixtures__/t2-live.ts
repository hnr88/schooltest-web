import { testSessionMonitorResponseSchema } from '@/modules/teacher/schemas/teacher-session.schema';
import { sittingMonitorSchema } from '@/modules/test-day';

import conflictJson from './t2-live-409.json';
import pausedJson from './t2-live-paused.json';
import runningJson from './t2-live-running.json';
import scoringFailedJson from './t2-live-scoring-failed.json';
import stalledJson from './t2-live-stalled.json';

// Recorded 2026-09-11 as t2 from :5500 (SP/s7b/record-live-fixtures.mjs): both
// monitor reads of ONE real sitting on Reading 8B — one student joined with a
// real answer, one joined with none, one marked absent, one not joined — then
// the same sitting after the teacher paused the empty attempt and granted the
// answered one +10 min; the 409 a second pause answered; and a long-running
// whole-class sitting holding a real stalled, offline student.
//
// TB-37 (recorded 2026-09-12 as t2 from :5500, both monitor reads of the real
// CLOSED sitting ztdkzn857kxl2nu02uinif9b on the same class): a whole-class
// sitting whose one non-`not_joined` tile is a REAL `scoring_failed` attempt
// carrying `result_document_id`. The recorded roster (`t2Roster`) answers that
// student's row with a DIFFERENT session's official Result, which is exactly
// the shape the Live tab's merge has to survive.

function snapshot(json: { teacher: unknown; sitting: unknown }) {
  return {
    teacher: testSessionMonitorResponseSchema.parse(json.teacher),
    sitting: sittingMonitorSchema.parse(json.sitting),
  };
}

export const t2LiveRunning = snapshot(runningJson);

export const t2LivePaused = snapshot(pausedJson);

export const t2LiveStalled = snapshot(stalledJson);

export const t2LiveScoringFailed = snapshot(scoringFailedJson);

export const t2Live409: { status: number; body: unknown } = conflictJson;
