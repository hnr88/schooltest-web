import type { AttributeName, ResultView } from '@schooltest/scoring-contracts';

import { getStudentFirstName } from '@/lib/student-name';
import { buildFamilyPreview, type FamilyNextStep, type FamilyPreviewView } from '@/modules/report';
import type { RosterStudent } from '@/modules/results';

import {
  CARER_CAN_KEY,
  CARER_EALD_NOTE_KEY,
  CARER_NEXT_KEY,
  CARER_SUMMARY_KEY,
} from '@/modules/teacher/constants/v2-i18n.constants';
import { CARER_LINE_LIMIT } from '@/modules/teacher/constants/v2-thresholds.constants';
import { phaseOfResult } from '@/modules/teacher/lib/v2/phase';
import { expectedView, releaseActions, releaseStatus } from '@/modules/teacher/lib/v2/release';
import { isAttributeName } from '@/modules/teacher/lib/v2/skill-refs';
import type { CarerLine, CarerReportView } from '@/modules/teacher/types/v2-family.types';

type FocusStep = Extract<FamilyNextStep, { kind: 'focus' }>;

function lineFor(skill: string, keys: Readonly<Record<AttributeName, string>>): CarerLine[] {
  return isAttributeName(skill) ? [{ attribute: skill, key: keys[skill] }] : [];
}

function canDoLines(preview: FamilyPreviewView): CarerLine[] {
  return preview.strengths
    .filter((strength) => strength.state === 'secure' || strength.state === 'getting_there')
    .flatMap((strength) => lineFor(strength.skill, CARER_CAN_KEY))
    .slice(0, CARER_LINE_LIMIT);
}

function nextLines(result: ResultView, preview: FamilyPreviewView): CarerLine[] {
  const focus = preview.nextSteps.find((step): step is FocusStep => step.kind === 'focus');
  if (focus === undefined) return [];
  const runnerUp = Object.entries(result.attributes)
    .flatMap(([skill, attribute]) =>
      attribute.status === 'not_assessed' || skill === focus.skill ? [] : [{ skill, score: attribute.domain_score }],
    )
    .sort((a, b) => a.score - b.score)
    .at(0);
  const skills = runnerUp === undefined ? [focus.skill] : [focus.skill, runnerUp.skill];
  return skills.flatMap((skill) => lineFor(skill, CARER_NEXT_KEY)).slice(0, CARER_LINE_LIMIT);
}

export function carerReport(result: ResultView, student: RosterStudent): CarerReportView {
  const preview = buildFamilyPreview(result);
  const actions = releaseActions(result.release_state);
  return {
    studentDocumentId: student.document_id,
    resultDocumentId: result.document_id,
    name: student.name,
    firstName: getStudentFirstName(student.name),
    initials: student.initials,
    score: result.overall.domain_score,
    expected: expectedView(result.readiness),
    phase: phaseOfResult(result),
    status: releaseStatus(result.release_state),
    satAt: result.history?.at(-1)?.sat_at ?? null,
    summaryKey: CARER_SUMMARY_KEY,
    canDo: canDoLines(preview),
    next: nextLines(result, preview),
    ealdNoteKey: student.eald_flag ? CARER_EALD_NOTE_KEY : null,
    actions: { release: actions.release, recall: actions.recall },
  };
}
