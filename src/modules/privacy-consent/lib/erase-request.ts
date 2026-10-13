import { ERASED_GIVEN_NAME } from '@/modules/privacy-consent/constants/components.constants';
import type {
  EraseRequestValues,
  EraseStudentBody,
} from '@/modules/privacy-consent/types/consent.types';
import type { EraseEntryInput, EraseEntryState } from '@/modules/privacy-consent/types/lib.types';

// The server compares `given_name.trim().toLowerCase()` with the typed value, so the
// dialog applies exactly that rule and a typed name that passes here passes there.
export function typedGivenNameMatches(typed: string, givenName: string | null | undefined): boolean {
  const expected = (givenName ?? '').trim().toLowerCase();
  return expected !== '' && typed.trim().toLowerCase() === expected;
}

// The tombstone `anonymiseStudent` leaves: given name `Erased` and no family name.
export function isErasedStudent(
  givenName: string | null | undefined,
  familyName: string | null | undefined,
): boolean {
  return givenName === ERASED_GIVEN_NAME && (familyName ?? '').trim() === '';
}

// Whether the panel offers the erase action, shows that it was done, or says nothing.
// Every arm needs a school administrator, `student_erasure_enabled` ON and an ARCHIVED
// student (the API refuses anyone else), so with the flag OFF nothing renders.
export function resolveEraseEntry({
  audience,
  config,
  studentStatus,
  givenName,
  familyName,
}: EraseEntryInput): EraseEntryState {
  if (audience !== 'school_admin' || config?.student_erasure_enabled !== true || studentStatus !== 'archived') {
    return 'none';
  }
  if (isErasedStudent(givenName, familyName)) {
    return 'erased';
  }
  return (givenName ?? '').trim() === '' ? 'none' : 'offer';
}

/** The local calendar date as `YYYY-MM-DD`; the default and the upper bound of "date received". */
export function localDateString(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

// Name matches, a reference is entered (at most `referenceMax`) and the date received
// is a real date that is not in the future. Channel always has a value.
export function isEraseRequestReady(
  values: EraseRequestValues,
  givenName: string | null | undefined,
  today: string,
  referenceMax: number,
): boolean {
  const reference = values.reference.trim();
  return (
    typedGivenNameMatches(values.typedName, givenName) &&
    reference !== '' &&
    reference.length <= referenceMax &&
    isRealDate(values.receivedOn) &&
    values.receivedOn <= today
  );
}

// The administrator picked a calendar date, not a moment: it is recorded as that date
// at 00:00 UTC, so it reads back as the same date wherever the audit row is read.
export function buildEraseBody(values: EraseRequestValues): EraseStudentBody {
  return {
    confirm_given_name: values.typedName.trim(),
    request: {
      channel: values.channel,
      reference: values.reference.trim(),
      received_at: `${values.receivedOn}T00:00:00.000Z`,
      verification_method: 'school_admin_authenticated',
    },
  };
}
