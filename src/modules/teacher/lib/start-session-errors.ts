import { isAxiosError } from 'axios';

import { zonedParts } from '@/modules/teacher/lib/start-session-schedule';
import { teacherErrorSchema } from '@/modules/teacher/schemas/teacher.schema';
import {
  bookingScheduleErrorDetailsSchema,
  testSessionBusyDetailsSchema,
  testSessionClashDetailsSchema,
} from '@/modules/teacher/schemas/teacher-session.schema';
import type {
  BlockedReason,
  StartSessionFailure,
} from '@/modules/teacher/types/start-session-modal.types';

const UNKNOWN_SITTING: BlockedReason = { kind: 'sitting', formLabel: '' };

/**
 * A refused create or edit → what the modal shows. A refused window answers the
 * design's own sentences (`details.schedule_errors`), shown as they are; a busy
 * or clashing student is greyed in the roster; anything else keeps the
 * server's message. Nothing is swallowed and nothing is invented.
 */
export function describeStartSessionFailure(error: unknown, timeZone: string): StartSessionFailure {
  const blocked = new Map<string, BlockedReason>();
  if (!isAxiosError(error) || !error.response) {
    return { message: error instanceof Error ? error.message : '', scheduleMessages: [], blocked };
  }
  const envelope = teacherErrorSchema.safeParse(error.response.data);
  if (!envelope.success) return { message: error.message, scheduleMessages: [], blocked };
  const { message, details } = envelope.data.error;

  const schedule = bookingScheduleErrorDetailsSchema.safeParse(details);
  if (schedule.success) {
    return { message: '', scheduleMessages: schedule.data.schedule_errors.map((entry) => entry.message), blocked };
  }

  const clash = testSessionClashDetailsSchema.safeParse(details);
  if (clash.success) {
    for (const entry of clash.data.clashes) {
      const reason: BlockedReason = {
        kind: 'booked',
        formLabel: entry.form?.label ?? '',
        opensAt: zonedParts(new Date(entry.opens_at), timeZone).time,
      };
      for (const id of entry.student_document_ids) blocked.set(id, reason);
    }
    for (const id of clash.data.busy_student_document_ids) if (!blocked.has(id)) blocked.set(id, UNKNOWN_SITTING);
    return { message, scheduleMessages: [], blocked };
  }

  const busy = testSessionBusyDetailsSchema.safeParse(details);
  if (busy.success) for (const id of busy.data.busy_student_document_ids) blocked.set(id, UNKNOWN_SITTING);
  return { message, scheduleMessages: [], blocked };
}
