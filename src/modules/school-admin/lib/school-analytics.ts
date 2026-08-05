import { READING_TEST_TYPE } from '@/modules/school-admin/constants/analytics.constants';
import type { SchoolParticipation } from '@/modules/school-admin/types/participation.types';
import type { Allowance, Entitlement } from '@/modules/school-admin/types/school-admin.types';

// Derived display values for the School analytics home. Every figure is read
// verbatim off a C-ENT-01 / C-RPT-04 payload — nothing is invented here, and a
// missing row reads as 0 (the same convention the entitlement service uses).

function readingAllowance(entitlement: Entitlement): Allowance | undefined {
  return entitlement.allowances.find((allowance) => allowance.test_type === READING_TEST_TYPE);
}

export function readingTestsCompleted(entitlement: Entitlement): number {
  return readingAllowance(entitlement)?.used ?? 0;
}

// The "/ 2" denominator and "Tests this cycle": the plan's reading allowance.
export function readingTestsAllowed(entitlement: Entitlement): number {
  return readingAllowance(entitlement)?.total ?? 0;
}

// Students who have completed the diagnostic. C-RPT-04 buckets Test A (the
// benchmark form of each class's parallel pair) per class, and a student sits
// in exactly one class roster, so the submitted buckets sum without overlap.
export function countStudentsTested(participation: SchoolParticipation): number {
  return participation.classes.reduce((total, row) => total + row.test_a.submitted, 0);
}
