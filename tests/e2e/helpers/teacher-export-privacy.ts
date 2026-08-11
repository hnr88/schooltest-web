import { expect, type PlaywrightWorkerArgs } from '@playwright/test';

import { parseTeacherExportFilename, teacherExportPath } from '@/modules/teacher/lib/teacher-export';
import { TEACHER_EXPORT_CONTENT_TYPE } from '@/modules/teacher/schemas/teacher-export.schema';
import type { TeacherExportRequest } from '@/modules/teacher/types/teacher-export.types';

import { anonymisedStudentId } from '../../../../schooltest-api/src/contracts/teacher-export';
import { runSql } from './auth-db';
import { API_BASE, bearer } from './teacher-results-live';

// Task 057 harness (brief flows 21, 25, 27 of .qa/E2E-FLOWS.md). The de-identification
// assertion is the whole point of this lane, so the forbidden values are read from
// POSTGRES — every roster student's given_name, family_name, email, student_key and
// documentId — not from an API response that has already de-identified them. One
// occurrence of one of those values in a downloaded body is a privacy failure.

/** The pattern CONTRACTS.md pins for an anonymised id; the API exports the same one. */
export const ANONYMISED_ID = /^S\d{2,}$/;

/** Roster order = `createdAt` asc, ties broken by documentId — `teacher-deidentify.ts`. */
export interface RosterIdentity {
  anonymisedId: string;
  documentId: string;
  createdAt: number;
  studentKey: string;
  givenName: string;
  familyName: string;
  email: string;
}

/**
 * Every student on one class roster WITH their real identifiers, straight out of
 * Postgres, ordered and numbered by the server's own roster rule so `anonymisedId`
 * is the id the export must have used for that student.
 */
export function dbClassRoster(classDocumentId: string): RosterIdentity[] {
  const rows = runSql(
    `select s.document_id, s.created_at, coalesce(s.student_key, ''), coalesce(s.given_name, ''),
            coalesce(s.family_name, ''), coalesce(s.email, '')
       from classes c
       join students_class_lnk scl on scl.class_id = c.id
       join students s on s.id = scl.student_id
      where c.document_id = '${classDocumentId}' and s.published_at is not null`,
  );
  if (!rows) throw new Error(`[e2e] class ${classDocumentId} has no roster rows in Postgres`);
  return rows
    .split('\n')
    .map((line) => {
      const [documentId, createdAt, studentKey, givenName, familyName, email] = line.split('|');
      return {
        anonymisedId: '',
        documentId,
        createdAt: Date.parse(createdAt.replace(' ', 'T') + 'Z'),
        studentKey,
        givenName,
        familyName,
        email,
      };
    })
    .sort((l, r) => l.createdAt - r.createdAt || (l.documentId < r.documentId ? -1 : 1))
    .map((row, index) => ({ ...row, anonymisedId: anonymisedStudentId(index) }));
}

/** The roster record for one student documentId; unknown id is a spec fault. */
export function rosterEntry(roster: readonly RosterIdentity[], documentId: string): RosterIdentity {
  const found = roster.find((row) => row.documentId === documentId);
  if (!found) throw new Error(`[e2e] ${documentId} is not on the roster read from Postgres`);
  return found;
}

/**
 * NONE of the five forbidden fields, for ANY student on the roster, may occur
 * anywhere in the text — matched case-insensitively as a plain substring, which is
 * stricter than the server's own word-boundary check. Returns how many real values
 * were actually searched for, so a caller can prove the check was not vacuous.
 */
export function expectNoRosterIdentity(text: string, roster: readonly RosterIdentity[]): number {
  const haystack = text.toLowerCase();
  let checked = 0;
  for (const student of roster) {
    const fields: ReadonlyArray<[string, string]> = [
      ['given_name', student.givenName],
      ['family_name', student.familyName],
      ['email', student.email],
      ['student_key', student.studentKey],
      ['documentId', student.documentId],
    ];
    for (const [field, value] of fields) {
      if (!value) continue;
      checked += 1;
      expect(
        haystack.includes(value.toLowerCase()),
        `${field} "${value}" (${student.anonymisedId}) leaked into the export`,
      ).toBe(false);
    }
  }
  return checked;
}

/**
 * Every `S…` token in the body is a contract-shaped anonymised id AND belongs to
 * this class's roster — an id the export invented, or a single-digit `S1`, fails.
 */
export function expectAnonymisedIds(body: string, roster: readonly RosterIdentity[]): string[] {
  const known = new Set(roster.map((row) => row.anonymisedId));
  const tokens = [...new Set(body.match(/\bS\d+\b/g) ?? [])];
  expect(tokens.length, 'the export must identify students by anonymised id').toBeGreaterThan(0);
  for (const token of tokens) {
    expect(token, `"${token}" is not a contract anonymised id`).toMatch(ANONYMISED_ID);
    expect(known.has(token), `"${token}" is not on this class roster`).toBe(true);
  }
  return tokens;
}

export interface ExportResponse {
  contentType: string;
  disposition: string;
  filename: string;
  body: string;
}

/**
 * The REAL C-TR-5/6/7 response, read server-to-server with a real teacher JWT.
 * The browser cannot see these headers (`strapi::cors` exposes none), so the
 * contracted `Content-Type` and `attachment; filename="….md"` are asserted here
 * and the downloaded file is then compared against these very bytes.
 */
export async function readExportResponse(
  playwright: PlaywrightWorkerArgs['playwright'],
  request: TeacherExportRequest,
): Promise<ExportResponse> {
  const context = await playwright.request.newContext();
  try {
    const jwt = await bearer(context);
    const response = await context.get(`${API_BASE}${teacherExportPath(request)}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(response.status(), `${teacherExportPath(request)} must answer 200`).toBe(200);
    const contentType = response.headers()['content-type'];
    const disposition = response.headers()['content-disposition'];
    expect(contentType).toBe(TEACHER_EXPORT_CONTENT_TYPE);
    expect(contentType).toContain('text/markdown');
    return {
      contentType,
      disposition,
      filename: parseTeacherExportFilename(disposition),
      body: await response.text(),
    };
  } finally {
    await context.dispose();
  }
}
