'use client';

import { z } from 'zod';
import { documentIdSchema } from '@schooltest/ops-contracts';

import { strapi } from '@/lib/axios/strapi';
import { downloadOpsFile } from '@/modules/ops/actions';
import type { OpsActionDefinition, OpsActionTarget } from '@/modules/ops/actions';
import {
  moveStudentClassAction,
  type MoveStudentClassTarget,
} from '@/modules/ops/queries/use-student-actions.mutation';
import { opsStudentProfilePath } from '@/modules/ops/queries/use-ops-student-profile.query';

/**
 * The first web consumers of C-OPS-ROSTER-ADD, C-OPS-ROSTER-REMOVE and
 * C-OPS-CLASS-EXPORT (task 21).
 *
 * FINDING, verified against the server source rather than the contract
 * record (same discipline D-55 records for the staff-user writes):
 * `mvp/ops/contracts/classes.md` describes the roster add/remove response as
 * `dataEnvelope({ added | removed: number })`. The deployed handlers
 * (`schooltest-api/src/api/class/lib/class-ops-roster.actions.ts` —
 * `opsAddStudents` / `opsRemoveStudents`) both return
 * `{ data: projectClassRow(existing, count) }` instead: a PARTIAL class row
 * (`documentId, name, year_band, teachers, student_count`) that does not even
 * satisfy the full `classRowSchema` (no `archived_at` / `school` /
 * `primary_teacher` / `test_window` / `updatedAt`). Parsed here against the
 * REAL shape rather than the stale record. Reported, not silently
 * reconciled: `classes.md` is outside this task's write set.
 */
const rosterWriteResultSchema = z.strictObject({
  documentId: documentIdSchema,
  name: z.string().nullable(),
  year_band: z.string().nullable(),
  teachers: z.array(
    z.strictObject({
      documentId: documentIdSchema,
      first_name: z.string().nullable(),
      last_name: z.string().nullable(),
    }),
  ),
  student_count: z.number().int().min(0),
});
export type RosterWriteResult = z.infer<typeof rosterWriteResultSchema>;

function rosterStudentsPath(classDocumentId: string): string {
  return `/api/ops/classes/${classDocumentId}/roster/students`;
}

/** C-OPS-CLASS-EXPORT — GET /api/ops/classes/{documentId}/export. */
export function classExportPath(classDocumentId: string): string {
  return `/api/ops/classes/${classDocumentId}/export`;
}

function classRosterFilename(className: string | null): string {
  const slug = (className ?? 'class')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return `${slug || 'class'}-roster.csv`;
}

/**
 * Streams the roster CSV straight from the server to disk — the client never
 * parses, holds or re-serialises a row. The server owns the column list
 * (`ROSTER_COLUMNS`, `class-export.actions.ts`); no `given_name` /
 * `family_name` / student identifier of any kind is read here at all.
 */
export async function downloadClassRoster(
  classDocumentId: string,
  className: string | null,
): Promise<void> {
  await downloadOpsFile({
    url: classExportPath(classDocumentId),
    expectedType: 'text/csv',
    fallbackFilename: classRosterFilename(className),
  });
}

/** C-OPS-ROSTER-ADD — POST /api/ops/classes/{documentId}/roster/students. */
export async function addStudentsToClass(
  classDocumentId: string,
  studentDocumentIds: readonly string[],
): Promise<RosterWriteResult> {
  const res = await strapi.post<{ data: unknown }>(rosterStudentsPath(classDocumentId), {
    student_documentIds: studentDocumentIds,
  });
  return rosterWriteResultSchema.parse(res.data.data);
}

/** C-OPS-ROSTER-REMOVE — DELETE /api/ops/classes/{documentId}/roster/students. */
export async function removeStudentsFromClass(
  classDocumentId: string,
  studentDocumentIds: readonly string[],
): Promise<RosterWriteResult> {
  const res = await strapi.delete<{ data: unknown }>(rosterStudentsPath(classDocumentId), {
    data: { student_documentIds: studentDocumentIds },
  });
  return rosterWriteResultSchema.parse(res.data.data);
}

const studentClassReadBackSchema = z.object({
  class: z.object({ documentId: documentIdSchema }).nullable(),
});

/** The narrow read-back both roster actions need: which class the student is on right now. */
async function fetchStudentClassDocumentId(
  schoolDocumentId: string,
  studentDocumentId: string,
): Promise<string | null> {
  const res = await strapi.get<{ data: unknown }>(
    opsStudentProfilePath(schoolDocumentId, studentDocumentId),
    { opsPortalVersioned: true },
  );
  return studentClassReadBackSchema.parse(res.data.data).class?.documentId ?? null;
}

/**
 * Remove from class (row + bulk). Removing NEVER unenrols from the school —
 * `writeClassStudents` only ever clears the `class` relation; the student's
 * own `status` is untouched server-side — so read-back proves the student
 * left THIS class, never that they left the school.
 */
export function removeFromClassAction(
  schoolDocumentId: string,
  classDocumentId: string,
): OpsActionDefinition<OpsActionTarget> {
  return {
    write: true,
    async perform(target) {
      await removeStudentsFromClass(classDocumentId, [target.documentId]);
    },
    async readBack(target) {
      return (await fetchStudentClassDocumentId(schoolDocumentId, target.documentId)) !== classDocumentId;
    },
  };
}

/**
 * Move class (row + bulk). ONE path, chosen ONCE by the size of the run about
 * to be dispatched — never per call site: a run of exactly one student
 * reuses task 18's `moveStudentClassAction` VERBATIM (C-OPS-STU-MOVE, with
 * its optimistic-concurrency check); a run of more than one goes through the
 * roster add/remove pair per student, because C-OPS-STU-MOVE is a
 * single-student endpoint and the two roster endpoints already accept an
 * id array.
 *
 * The two-step is NOT atomic: if the add lands and the remove then fails,
 * `perform` rejects on the remove's error and the runner's own read-back is
 * what decides success/uncertain — never the second call's outcome alone, and
 * never "moved" on an unproven remove.
 */
export function moveClassRosterAction(
  schoolDocumentId: string,
  sourceClassDocumentId: string,
  destinationClassDocumentId: string,
  runSize: number,
): OpsActionDefinition<MoveStudentClassTarget> {
  if (runSize === 1) {
    return moveStudentClassAction(schoolDocumentId, destinationClassDocumentId);
  }
  return {
    write: true,
    async perform(target) {
      await addStudentsToClass(destinationClassDocumentId, [target.documentId]);
      await removeStudentsFromClass(sourceClassDocumentId, [target.documentId]);
    },
    async readBack(target) {
      return (
        (await fetchStudentClassDocumentId(schoolDocumentId, target.documentId)) ===
        destinationClassDocumentId
      );
    },
  };
}
