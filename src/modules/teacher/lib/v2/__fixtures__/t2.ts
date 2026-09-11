import { resultViewSchema, type ResultView } from '@schooltest/scoring-contracts';

import { classRosterResponseSchema, type RosterRow } from '@/modules/results';
import { classDiagnosticSchema } from '@/modules/teach/schemas/diagnostic.schema';
import type { TeachingDiagnostic } from '@/modules/teacher/types/v2-insights.types';

import amaraJson from './t2-result-amara.json';
import diagnosticJson from './t2-diagnostic.json';
import dilnozaJson from './t2-result-dilnoza.json';
import rosterJson from './t2-roster.json';

export const t2Roster: RosterRow[] = classRosterResponseSchema.parse(rosterJson);

export const t2Diagnostic: TeachingDiagnostic = classDiagnosticSchema
  .pick({ form_code: true, groups: true })
  .parse(diagnosticJson);

export const t2ResultDilnoza: ResultView = resultViewSchema.parse(dilnozaJson);

export const t2ResultAmara: ResultView = resultViewSchema.parse(amaraJson);

export function t2Row(firstName: string): RosterRow {
  const row = t2Roster.find((entry) => entry.student.name.startsWith(`${firstName} `));
  if (row === undefined) throw new Error(`no recorded t2 roster row for ${firstName}`);
  return row;
}

export function t2Result(firstName: string): ResultView {
  const { result } = t2Row(firstName);
  if (result === null) throw new Error(`recorded t2 roster row for ${firstName} has no result`);
  return result;
}
