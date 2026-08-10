import { expect, test } from '@playwright/test';

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

import { runSql } from './helpers/auth-db';

// Task 030 — contract-shaped bodies for every entry of .qa/CONTRACTS.md the
// teacher PORTAL consumes, parsed by the server schema and the web mirror and
// asserted to produce the SAME value. The /api/teacher/** routes do not exist
// yet (a parallel track is building them), so these bodies are declared here in
// the test and never shipped: nothing in src/modules/teacher returns them, and
// no query hook has a canned-data path.
//
// The identifiers are REAL: they are read out of PostgreSQL with psql, so the
// documentId regex is exercised against Strapi's own ids rather than a
// hand-written 24-character string.

interface ContractParser {
  safeParse: (value: unknown) => { success: boolean; data?: unknown; error?: { message: string } };
}

const [CLASS_ID, CLASS_NAME, STUDENT_ID, FORM_ID] = runSql(
  `select c.document_id, c.name, s.document_id, f.document_id
     from classes c, students s, forms f
    where f.form_code = 'RDG-DIAG-A-79'
    order by c.id, s.id limit 1`,
).split('|');

// `sittings` is empty in the seed, so every sitting-shaped id below reuses a
// REAL Strapi documentId read above instead of an invented literal.
const SITTING_ID = FORM_ID;
const NOW = new Date().toISOString();
const CLASS_REF = { document_id: CLASS_ID, name: CLASS_NAME };
const STUDENT_REF = { student_document_id: STUDENT_ID, display_name: 'Omar K.' };
const TOP_GAP = { attribute: 'R6', name: 'Propositional Inference', not_yet_count: 3 };
const COMPLETION = { completed: 2, total: 4 };

const DASHBOARD = {
  classes: [
    {
      class_document_id: CLASS_ID,
      name: CLASS_NAME,
      year_band: '7_9',
      student_count: 4,
      test_a: COMPLETION,
      test_b: { completed: 0, total: 4 },
      top_gap: TOP_GAP,
    },
  ],
  live_session: {
    sitting_document_id: SITTING_ID,
    code: 'READ-4821',
    class_name: CLASS_NAME,
    test_variant: 'A',
    opened_at: NOW,
  },
};

const TESTS = {
  tests: [
    {
      form_document_id: FORM_ID,
      variant: 'A',
      // The server's own formatter, so the label copy is never restated here.
      label: apiTeacher.testVariantLabel('A'),
      skill: 'reading',
    },
  ],
};

const CREATE_BODY = { class_document_id: CLASS_ID, form_document_id: FORM_ID };
const CREATED = {
  sitting_document_id: SITTING_ID,
  code: 'READ-4821',
  class: CLASS_REF,
  variant: 'B',
  status: 'open',
  opened_at: NOW,
};

const SESSIONS = {
  sessions: [
    {
      sitting_document_id: SITTING_ID,
      code: null,
      status: 'closed',
      class: CLASS_REF,
      variant: null,
      opened_at: null,
      closed_at: NOW,
      completed: 3,
      expected: 4,
    },
  ],
};

const MONITOR = {
  sitting: {
    document_id: SITTING_ID,
    code: 'READ-4821',
    status: 'open',
    opened_at: NOW,
    class: CLASS_REF,
    variant: 'A',
  },
  stall_threshold_minutes: 5,
  summary: { expected: 4, joined: 1, in_progress: 1, submitted: 1, stalled: 1 },
  students: [
    {
      ...STUDENT_REF,
      state: 'not_joined',
      stage: null,
      total_stages: null,
      inactive_minutes: null,
    },
    { ...STUDENT_REF, state: 'in_progress', stage: 2, total_stages: 3, inactive_minutes: null },
    { ...STUDENT_REF, state: 'stalled', stage: 1, total_stages: 3, inactive_minutes: 8 },
  ],
};

const CLOSED = { sitting_document_id: SITTING_ID, status: 'closed', closed_at: NOW };

const CLASS_STUDENTS = {
  class: { ...CLASS_REF, year_band: '7_9', student_count: 4 },
  summary: {
    test_a: COMPLETION,
    test_b: { completed: 0, total: 4 },
    avg_score: 62,
    top_gap: TOP_GAP,
  },
  students: [
    {
      ...STUDENT_REF,
      test_a: { state: 'done', score: 72, acara_phase: 'Developing' },
      test_b: { state: 'not_started', score: null, acara_phase: null },
    },
  ],
};

const DRILL_DOWN = {
  student: {
    document_id: STUDENT_ID,
    display_name: 'Omar K.',
    year_band: '7_9',
    first_language: 'Vietnamese',
    class_name: CLASS_NAME,
  },
  bands: { mastered_cut: 0.8, approaching_cut: 0.5 },
  tests: [
    {
      variant: 'B',
      completed_at: NOW,
      score: 81,
      acara_phase: 'Consolidating',
      display_label: 'Consolidating reader',
      subskills: [
        {
          attribute: 'R6',
          name: 'Propositional Inference',
          likelihood: 78,
          status: 'approaching',
          previous_likelihood: 62,
          delta: 16,
        },
        {
          attribute: 'R7',
          name: 'Critical Reading',
          likelihood: null,
          status: 'not_assessed',
          previous_likelihood: null,
          delta: null,
        },
      ],
    },
  ],
  progress: {
    score_delta: 9,
    acara_from: 'Developing',
    acara_to: 'Consolidating',
    improved: 5,
    stable: 2,
    regressed: 0,
  },
};

const INSIGHTS = {
  class: CLASS_REF,
  completed_count: 14,
  mastery: [
    { attribute: 'R1', name: 'Word Decoding', mastered_count: 11, assessed_count: 14, ratio: 0.79 },
  ],
  groups: [
    { key: 'R6', label: 'Inference', hint: 'Focus on implied meaning', students: [STUDENT_REF] },
    {
      key: 'no_gaps',
      label: 'No gaps identified',
      hint: 'Extend with challenge texts',
      students: [],
    },
  ],
};

const COHORT = { both_tests: 19, test_a_completed: 21, test_b_completed: 19, total: 21 };

const PROGRESS = {
  available: true,
  cohort: COHORT,
  summary: { avg_a: 62, avg_b: 71, avg_delta: 9, improved: 15, unchanged: 2, regressed: 2 },
  subskill_shift: [{ attribute: 'R5', name: 'Detail', a_mastered: 14, b_mastered: 16, change: 2 }],
  acara_movement: {
    up: 7,
    same: 11,
    down: 1,
    up_detail: [{ from: 'Beginning', to: 'Emerging', count: 3 }],
    down_detail: [],
    same_improved_within_phase: 8,
  },
  most_improved: [{ ...STUDENT_REF, score_a: 45, score_b: 63, delta: 18 }],
  needs_attention: [{ ...STUDENT_REF, score_a: 52, score_b: 48, delta: -4 }],
};

const PROGRESS_EMPTY = {
  available: false,
  cohort: { ...COHORT, both_tests: 0, test_b_completed: 0 },
  summary: null,
  subskill_shift: [],
  acara_movement: null,
  most_improved: [],
  needs_attention: [],
};

const EXPORT_HEADERS = {
  'content-type': 'text/markdown; charset=utf-8',
  'content-disposition': 'attachment; filename="eal-d-8a-insights.md"',
};
const EXPORT_BODY = '# Class profile\n\n- S01 — R6 not yet\n\n## Prompt\n\nYou are a teacher...\n';

const TEACHER_ERROR = {
  data: null,
  error: { status: 403, name: 'ForbiddenError', message: 'Forbidden', details: {} },
};

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

function isParser(value: unknown): value is ContractParser {
  if (typeof value !== 'object' || value === null) return false;
  return typeof (value as { safeParse?: unknown }).safeParse === 'function';
}

/** Both sides of one contract shape, looked up by the name they BOTH export. */
function pair(schemaName: string): [ContractParser, ContractParser] {
  const server = API[schemaName];
  const web = WEB[schemaName];
  if (!isParser(server)) throw new Error(`server contract has no schema '${schemaName}'`);
  if (!isParser(web)) throw new Error(`web mirror has no schema '${schemaName}'`);
  return [server, web];
}

const DRILL_TEST = DRILL_DOWN.tests[0];

const CASES: Array<[string, string, unknown]> = [
  ['C-TD-1', 'teacherDashboardResponseSchema', DASHBOARD],
  ['C-TD-2', 'teacherTestsResponseSchema', TESTS],
  ['C-TS-1 body', 'createTestSessionBodySchema', CREATE_BODY],
  ['C-TS-1 201', 'createTestSessionResponseSchema', CREATED],
  ['C-TS-2', 'teacherTestSessionsResponseSchema', SESSIONS],
  ['C-TS-3', 'testSessionMonitorResponseSchema', MONITOR],
  ['C-TS-4', 'closeTestSessionResponseSchema', CLOSED],
  ['C-TR-1', 'classStudentsResponseSchema', CLASS_STUDENTS],
  ['C-TR-2', 'studentDrillDownResponseSchema', DRILL_DOWN],
  ['C-TR-3', 'classInsightsResponseSchema', INSIGHTS],
  ['C-TR-4 available', 'classProgressResponseSchema', PROGRESS],
  ['C-TR-4 empty state', 'classProgressResponseSchema', PROGRESS_EMPTY],
  ['C-TR-5/6/7 headers', 'teacherExportHeadersSchema', EXPORT_HEADERS],
  ['C-TR-5/6/7 body', 'teacherExportDocumentSchema', EXPORT_BODY],
  ['error envelope', 'teacherErrorSchema', TEACHER_ERROR],
];

const REJECTED: Array<[string, string, unknown]> = [
  ['C-TD-1 unknown key', 'teacherDashboardResponseSchema', { ...DASHBOARD, avg_score: 62 }],
  ['C-TD-1 missing field', 'teacherDashboardResponseSchema', { classes: DASHBOARD.classes }],
  [
    'C-TD-1 bad documentId',
    'teacherDashboardResponseSchema',
    { ...DASHBOARD, classes: [{ ...DASHBOARD.classes[0], class_document_id: 'not-an-id' }] },
  ],
  ['C-TS-1 201 null code', 'createTestSessionResponseSchema', { ...CREATED, code: null }],
  [
    'C-TS-3 stage 4',
    'testSessionMonitorResponseSchema',
    { ...MONITOR, students: [{ ...MONITOR.students[1], stage: 4 }] },
  ],
  [
    'C-TR-2 likelihood 105',
    'studentDrillDownResponseSchema',
    {
      ...DRILL_DOWN,
      tests: [{ ...DRILL_TEST, subskills: [{ ...DRILL_TEST.subskills[0], likelihood: 105 }] }],
    },
  ],
  [
    'C-TR-3 unknown group key',
    'classInsightsResponseSchema',
    { ...INSIGHTS, groups: [{ ...INSIGHTS.groups[0], key: 'R9' }] },
  ],
  [
    'C-TR-4 four movers',
    'classProgressResponseSchema',
    { ...PROGRESS, most_improved: Array.from({ length: 4 }, () => PROGRESS.most_improved[0]) },
  ],
  [
    'export inline disposition',
    'teacherExportHeadersSchema',
    { ...EXPORT_HEADERS, 'content-disposition': 'inline; filename="x.md"' },
  ],
  [
    'export wrong content type',
    'teacherExportHeadersSchema',
    { ...EXPORT_HEADERS, 'content-type': 'text/plain' },
  ],
  ['export without ## Prompt', 'teacherExportDocumentSchema', '# Class profile\n\n- S01\n'],
];

test.describe('teacher contract — fixtures parse identically on both sides', () => {
  test('every real documentId in Postgres satisfies the contract id pattern', () => {
    const ids = runSql(
      `select document_id from classes
       union all select document_id from students
       union all select document_id from forms`,
    )
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean);
    expect(ids.length).toBeGreaterThan(10);
    for (const id of ids) {
      expect(webTeacher.teacherDocumentIdSchema.safeParse(id).success, id).toBe(true);
      expect(apiTeacher.teacherDocumentIdSchema.safeParse(id).success, id).toBe(true);
    }
  });

  for (const [label, schemaName, fixture] of CASES) {
    test(`${label} parses on the server schema and the web mirror, to the same value`, () => {
      const [server, web] = pair(schemaName);
      const parsedServer = server.safeParse(fixture);
      const parsedWeb = web.safeParse(fixture);
      expect(parsedServer.success, `${label} server: ${parsedServer.error?.message}`).toBe(true);
      expect(parsedWeb.success, `${label} web: ${parsedWeb.error?.message}`).toBe(true);
      expect(parsedWeb.data).toEqual(parsedServer.data);
    });
  }

  for (const [label, schemaName, fixture] of REJECTED) {
    test(`${label} is rejected by both sides`, () => {
      const [server, web] = pair(schemaName);
      expect(server.safeParse(fixture).success, `${label} server`).toBe(false);
      expect(web.safeParse(fixture).success, `${label} web`).toBe(false);
    });
  }

  test('an unknown key is an unrecognized_keys issue, not a silently dropped field', () => {
    const parsed = webTeacher.teacherDashboardResponseSchema.safeParse({ ...DASHBOARD, extra: 1 });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.code).toBe('unrecognized_keys');
  });
});
