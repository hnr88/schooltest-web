import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { MASTERY_BAND_TONE } from '@/modules/teacher/constants/mastery.constants';
import {
  parseTeacherExportFilename,
  teacherExportPath,
} from '@/modules/teacher/lib/teacher-export';
import * as webExport from '@/modules/teacher/schemas/teacher-export.schema';
import * as webProgress from '@/modules/teacher/schemas/teacher-progress.schema';
import * as webResults from '@/modules/teacher/schemas/teacher-result.schema';
import * as webSessions from '@/modules/teacher/schemas/teacher-session.schema';
import * as webTeacher from '@/modules/teacher/schemas/teacher.schema';

import * as apiExport from '../../../schooltest-api/src/contracts/teacher-export';
import * as apiProgress from '../../../schooltest-api/src/contracts/teacher-progress';
import * as apiResults from '../../../schooltest-api/src/contracts/teacher-results';
import * as apiSessions from '../../../schooltest-api/src/contracts/teacher-sessions';
import * as apiTeacher from '../../../schooltest-api/src/contracts/teacher';
import { readingAttributeSchema, stageSchema } from '../../../schooltest-api/src/contracts/vocab';

// Task 030 — `src/modules/teacher/schemas/**` is a MIRROR of the server contract
// module (.qa/CONTRACTS.md; schooltest-api/src/contracts/teacher*.ts). This spec
// makes that claim MECHANICAL instead of editorial: it diffs the exported name
// sets and, for every shared name, the object field names and the enum options.
// A field added, renamed, retyped away from an object/enum, or dropped on either
// side fails here. Both module graphs are pure Zod — nothing is stubbed and
// nothing is imported from the running server.

const API: Record<string, unknown> = {
  ...apiTeacher,
  ...apiSessions,
  ...apiResults,
  ...apiProgress,
  ...apiExport,
};

const WEB: Record<string, unknown> = {
  ...webTeacher,
  ...webSessions,
  ...webResults,
  ...webProgress,
  ...webExport,
};

// Server-owned names the PORTAL DELIBERATELY DOES NOT MIRROR, each for a reason
// a reviewer can check:
//  - the anonymised-id trio + `teacherExportDisposition`: de-identification and
//    the disposition header are produced server-side; a client copy could only
//    disagree with the work already done.
//  - `joinByEmailBodySchema` / `JOIN_BY_EMAIL_RESPONSE_OWNER` (C-SJ-1): the
//    student DESKTOP app's join path, never called from the teacher portal.
//  - `teacherDocumentParamsSchema` / `teacherClassStudentParamsSchema`: server
//    route-param validators, not wire bodies the client parses.
//  - `TEACHER_TEST_FORM_CODES` / `testVariantForFormCode` / `testVariantLabel`:
//    variant resolution and the label COPY are the server's (C-TD-2 ships
//    `variant` and `label` on the wire); restating the copy client-side would
//    also be a hardcoded user-facing string.
const SERVER_ONLY = [
  'ANONYMISED_STUDENT_ID_PATTERN',
  'JOIN_BY_EMAIL_RESPONSE_OWNER',
  'TEACHER_TEST_FORM_CODES',
  'anonymisedStudentId',
  'anonymisedStudentIdSchema',
  'joinByEmailBodySchema',
  'teacherClassStudentParamsSchema',
  'teacherDocumentParamsSchema',
  'teacherExportDisposition',
  'testVariantForFormCode',
  'testVariantLabel',
].sort();

// Portal-side names with no same-file server twin: two live in the server's
// `vocab.ts` (asserted equal below), `sittingStatusSchema` is a module-local
// const on the server, and the disposition pattern is the server's own regex
// with a capture group so one expression both validates and names the file.
const WEB_ONLY = [
  'TEACHER_EXPORT_DISPOSITION_PATTERN',
  'readingAttributeSchema',
  'sittingStatusSchema',
  'stageSchema',
].sort();

function shapeKeys(schema: unknown): string[] | null {
  if (typeof schema !== 'object' || schema === null) return null;
  const shape = (schema as { shape?: unknown }).shape;
  if (typeof shape !== 'object' || shape === null) return null;
  return Object.keys(shape).sort();
}

function enumOptions(schema: unknown): string[] | null {
  if (typeof schema !== 'object' || schema === null) return null;
  const options = (schema as { options?: unknown }).options;
  if (!Array.isArray(options)) return null;
  if (!options.every((option) => typeof option === 'string')) return null;
  return [...options].sort();
}

test.describe('teacher contract — web mirror vs schooltest-api/src/contracts', () => {
  test('the exported name sets differ only by the documented server-only / web-only lists', () => {
    const apiNames = Object.keys(API).sort();
    const webNames = Object.keys(WEB).sort();

    expect(apiNames.length).toBeGreaterThan(0);
    expect(apiNames.filter((name) => !webNames.includes(name))).toEqual(SERVER_ONLY);
    expect(webNames.filter((name) => !apiNames.includes(name))).toEqual(WEB_ONLY);
  });

  test('every shared object schema has identical field names and every enum identical options', () => {
    const shared = Object.keys(API).filter((name) => name in WEB);
    expect(shared.length).toBe(Object.keys(API).length - SERVER_ONLY.length);

    let objectsCompared = 0;
    let enumsCompared = 0;
    for (const name of shared) {
      const apiShape = shapeKeys(API[name]);
      expect(shapeKeys(WEB[name]), name).toEqual(apiShape);
      if (apiShape) objectsCompared += 1;

      const apiOptions = enumOptions(API[name]);
      expect(enumOptions(WEB[name]), name).toEqual(apiOptions);
      if (apiOptions) enumsCompared += 1;
    }

    // Guard the guard: a comparison loop that compared nothing would pass.
    expect(objectsCompared).toBeGreaterThanOrEqual(30);
    expect(enumsCompared).toBeGreaterThanOrEqual(4);
  });

  test('the two vocabulary schemas the portal restates match src/contracts/vocab.ts', () => {
    expect(webTeacher.readingAttributeSchema.options).toEqual(readingAttributeSchema.options);
    expect([...webSessions.stageSchema.values]).toEqual([...stageSchema.values]);
  });

  test('the export transport constants are byte-identical to the server contract', () => {
    expect(webExport.TEACHER_EXPORT_CONTENT_TYPE).toBe(apiExport.TEACHER_EXPORT_CONTENT_TYPE);
    expect(webExport.TEACHER_EXPORT_PROMPT_HEADING).toBe(apiExport.TEACHER_EXPORT_PROMPT_HEADING);
  });
});

const TEACHER_MODULE_DIR = path.resolve(process.cwd(), 'src', 'modules', 'teacher');

function teacherSourceFiles(dir = TEACHER_MODULE_DIR): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return teacherSourceFiles(full);
    return entry.name.endsWith('.ts') ? [full] : [];
  });
}

/** `>= 0.8`, `< 50`, `> 80` … the shape of a client-side re-threshold. */
const CUT_COMPARISON = /[<>]=?\s*(0\.8|0\.5|\b80\b|\b50\b)/;

/**
 * Comment lines are dropped before the scan — the module deliberately QUOTES the
 * spec's "green >= 80 / amber 50-79" prose to explain why it never applies it,
 * and `=>` is stripped so an arrow function is not read as a `>` comparison.
 */
function executableSource(file: string): string {
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\/\*|\*)/.test(line))
    .join('\n')
    .replaceAll('=>', '');
}

// The paths .qa/CONTRACTS.md gives the eleven operations the PORTAL calls,
// with every `${…}` interpolation normalised to `:param`. The three C-TR-5/6/7
// export routes are built by `teacherExportPath` and asserted separately.
const CONTRACT_PATHS = [
  '/api/teacher/classes/:param/insights',
  '/api/teacher/classes/:param/progress',
  '/api/teacher/classes/:param/students',
  '/api/teacher/classes/:param/students/:param',
  '/api/teacher/dashboard',
  '/api/teacher/test-sessions',
  '/api/teacher/test-sessions/:param/close',
  '/api/teacher/test-sessions/:param/monitor',
  '/api/teacher/tests',
];

test.describe('teacher module — the data layer is the real typed Axios instance', () => {
  test('every query hook imports the shared instance and calls a real contract path', () => {
    const queryFiles = teacherSourceFiles(path.join(TEACHER_MODULE_DIR, 'queries'));
    expect(queryFiles).toHaveLength(11);

    const called = new Set<string>();
    for (const file of queryFiles) {
      const source = readFileSync(file, 'utf8');
      expect(source.includes("import { strapi } from '@/lib/axios/strapi';"), file).toBe(true);
      expect(/\bfetch\(|axios\.create|new XMLHttpRequest/.test(source), file).toBe(false);
      for (const [, url] of source.matchAll(/['"`](\/api\/[^'"`]*)['"`]/g)) {
        called.add(url.replaceAll(/\$\{[^}]+\}/g, ':param'));
      }
    }
    expect([...called].sort()).toEqual(CONTRACT_PATHS);
  });
});

test.describe('teacher module — the anti-re-threshold discipline', () => {
  test('MASTERY_BAND_TONE keys are exactly the server band vocabulary', () => {
    expect(Object.keys(MASTERY_BAND_TONE).sort()).toEqual(
      [...webTeacher.masteryBandSchema.options].sort(),
    );
  });

  test('no teacher source file compares a likelihood against a cut', () => {
    const files = teacherSourceFiles();
    expect(files.length).toBeGreaterThan(10);
    for (const file of files) {
      expect(CUT_COMPARISON.test(executableSource(file)), file).toBe(false);
    }
    // Guard the guard: the same scan DOES flag a cut comparison when one exists.
    expect(CUT_COMPARISON.test('const mastered = likelihood >= 80;')).toBe(true);
  });

  test('teacherExportPath builds the three C-TR-5/6/7 routes and nothing else', () => {
    expect(teacherExportPath({ kind: 'insights', classDocumentId: 'c1' })).toBe(
      '/api/teacher/classes/c1/export/insights',
    );
    expect(teacherExportPath({ kind: 'progress', classDocumentId: 'c1' })).toBe(
      '/api/teacher/classes/c1/export/progress',
    );
    expect(
      teacherExportPath({ kind: 'student', classDocumentId: 'c1', studentDocumentId: 's1' }),
    ).toBe('/api/teacher/classes/c1/students/s1/export');
  });

  test('parseTeacherExportFilename returns the server filename and never invents one', () => {
    expect(parseTeacherExportFilename('attachment; filename="eal-d-8a-insights.md"')).toBe(
      'eal-d-8a-insights.md',
    );
    expect(() => parseTeacherExportFilename('inline; filename="x.md"')).toThrow();
    expect(() => parseTeacherExportFilename('attachment; filename="x.csv"')).toThrow();
  });
});
