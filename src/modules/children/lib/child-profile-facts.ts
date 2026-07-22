import { formatYearLevel } from '@/modules/children/lib/year-level';
import type {
  ChildProfileFact,
  ChildProgressStudent,
  StudentDetail,
} from '@/modules/children/types/children.types';

interface HeroLabels {
  formatYear: (year: number) => string;
  school: string | null;
  born: string | null;
}

// The canonical hero meta line ("Grade 4B · Nørrebro Heights School · Born
// 03.06.2016") — real enrolment facts about THIS child, joined in reading order.
// A fact the API never recorded is left out entirely; an empty result means the
// caller shows the honest "nothing recorded yet" sentence instead.
export function getHeroMetaFacts(
  student: ChildProgressStudent,
  { formatYear, school, born }: HeroLabels,
): string[] {
  return [formatYearLevel(student, formatYear), school, born, student.nationality].filter(
    (fact): fact is string => Boolean(fact),
  );
}

interface DetailLabels {
  formatYear: (year: number) => string;
  yearLevel: string;
  dateOfBirth: string;
  gender: string;
  genderValue: string | null;
  nationality: string;
  currentSchool: string;
  targetEntry: string;
  signInEmail: string;
  addedOn: string;
  born: string | null;
  added: string;
  targetEntryValue: string | null;
}

// The enrolment panel. Every row is a field the parent detail read (GET
// /api/my/students/:documentId) actually returns; rows the API left null are
// dropped by the panel, never rendered as "—".
export function getEnrolmentFacts(
  detail: StudentDetail,
  labels: DetailLabels,
): ChildProfileFact[] {
  return [
    { label: labels.yearLevel, value: formatYearLevel(detail, labels.formatYear) },
    { label: labels.dateOfBirth, value: labels.born },
    { label: labels.gender, value: labels.genderValue },
    { label: labels.nationality, value: detail.nationality },
    { label: labels.currentSchool, value: detail.current_school },
    { label: labels.targetEntry, value: labels.targetEntryValue },
    { label: labels.signInEmail, value: detail.email },
    { label: labels.addedOn, value: labels.added },
  ];
}

interface GuardianLabels {
  email: string;
  phone: string;
  wechat: string;
  preferredContact: string;
  channelValue: string | null;
}

// The canonical "Linked parents" panel, fed by the guardian block the detail read
// returns. Contact rows the API left null are dropped by the panel.
export function getGuardianFacts(
  detail: StudentDetail,
  labels: GuardianLabels,
): ChildProfileFact[] {
  return [
    { label: labels.email, value: detail.parent_guardian_email },
    { label: labels.phone, value: detail.parent_guardian_phone },
    { label: labels.wechat, value: detail.parent_guardian_wechat },
    { label: labels.preferredContact, value: labels.channelValue },
  ];
}
