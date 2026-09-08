import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, test } from 'vitest';
import {
  OPS_RESPONSES_CSV_HEADER,
  OPS_RESPONSES_CSV_PATH,
  formInspectionPath,
  formInspectionSchema,
  responsesCsvQuerySchema,
  viewAsTeacherPath,
  viewAsTeacherSchema,
} from '@schooltest/ops-contracts';

import { inspectionCell } from '@/modules/ops/lib/inspection.lib';

/**
 * Ledger row 11 / D-007 — the three C-OPS-04 inspection surfaces against the
 * REAL SERVED BYTES.
 *
 * `tests/fixtures/ops-inspection-wire.json` is a verbatim capture of the live
 * responses (form inspection and responses.csv from :5500, view-as-teacher from
 * a throwaway :5508 because that read WRITES an audit row), not a hand-written
 * payload. The point of these assertions is that the contract the browser
 * parses with is the shape the server actually sends — the C-11 lesson, applied
 * before shipping rather than after.
 */
const WIRE = JSON.parse(
  readFileSync(resolve(__dirname, '../fixtures/ops-inspection-wire.json'), 'utf8'),
) as {
  formInspection: unknown;
  formInspectionItemCountLive: number;
  viewAsTeacher: unknown;
  responsesCsvHeader: string;
  responsesCsvFirstRow: string;
};

describe('ledger 11 — the C-OPS-04 inspection surfaces parse the live wire', () => {
  test('11a: the form inspection body parses, keys and Q-matrix vectors included', () => {
    const parsed = formInspectionSchema.parse(WIRE.formInspection);
    expect(parsed.form_code).toBe('RDG-PRAC-A-79');
    expect(parsed.locked).toBe(false);
    expect(parsed.items.length).toBeGreaterThan(0);
    // The reason this surface is ops-only: it carries the correct key.
    expect(parsed.items[0].key).toEqual({ type: 'single', answer: 'c' });
    expect(parsed.items[0].attribute_vector).toEqual([1, 0, 0]);
  });

  test('11a: the strict body rejects a key the contract never promised', () => {
    const leaked = { ...(WIRE.formInspection as object), student_name: 'Ada L.' };
    expect(formInspectionSchema.safeParse(leaked).success).toBe(false);
  });

  test('11a: an unknown `key`/`attribute_vector` shape still renders, never [object Object]', () => {
    expect(inspectionCell({ type: 'single', answer: 'c' })).toBe('{"type":"single","answer":"c"}');
    expect(inspectionCell([1, 0, 0])).toBe('[1,0,0]');
    expect(inspectionCell(null)).toBe('—');
    expect(inspectionCell('')).toBe('—');
    expect(inspectionCell(0)).toBe('0');
  });

  test('11b: the csv query requires a session id, and the header is the served one', () => {
    expect(responsesCsvQuerySchema.safeParse({}).success).toBe(false);
    expect(
      responsesCsvQuerySchema.safeParse({ session_documentId: 'dyvqpiunc7a4mibn2f6fnwwu' }).success,
    ).toBe(true);
    // A second query key cannot be smuggled onto an ops export.
    expect(
      responsesCsvQuerySchema.safeParse({
        session_documentId: 'dyvqpiunc7a4mibn2f6fnwwu',
        limit: 5,
      }).success,
    ).toBe(false);
    expect(WIRE.responsesCsvHeader).toBe(OPS_RESPONSES_CSV_HEADER);
    expect(WIRE.responsesCsvFirstRow.startsWith('"dyvqpiunc7a4mibn2f6fnwwu"')).toBe(true);
  });

  test('11c: the view-as-teacher body parses — teacher, their classes, their sittings', () => {
    const parsed = viewAsTeacherSchema.parse(WIRE.viewAsTeacher);
    expect(parsed.teacher.email).toBe('teacher@schooltest.local');
    expect(parsed.classes.length).toBe(3);
    expect(parsed.classes[0].student_count).toBeGreaterThanOrEqual(0);
    // Opaque by contract (C-SIT-02 owns the monitor shape), so the panel can
    // only ever claim a count — which is exactly what it renders.
    expect(Array.isArray(parsed.monitors)).toBe(true);
  });

  test('the three paths are the live routes, not invented ones', () => {
    expect(formInspectionPath('fjll869zj088p01t5ly4z9pp')).toBe(
      '/api/ops/forms/fjll869zj088p01t5ly4z9pp/inspection',
    );
    expect(OPS_RESPONSES_CSV_PATH).toBe('/api/ops/responses.csv');
    expect(viewAsTeacherPath('b61g8tt94pl1a723vavli7fk')).toBe(
      '/api/ops/view-as-teacher/b61g8tt94pl1a723vavli7fk',
    );
  });
});
