/**
 * The ONE normalisation rule for every typed-name confirmation.
 *
 * Documented once here because a second rule elsewhere would mean two different
 * answers to "did the operator type the school's name": NFC-normalise so a
 * composed and a decomposed accent match, trim the ends, collapse runs of
 * whitespace to one space, then case-fold. Nothing else — no accent stripping,
 * no punctuation removal, because "St Mary's" and "St Marys" are different
 * schools and the confirmation exists to catch exactly that.
 *
 * This gate is a typing check, never an authorization one: the server still
 * authorizes by documentId and version, so a matched string grants nothing.
 */
export function normaliseTypedName(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}

/** True when what was typed matches the expected name under the rule above. */
export function typedNameMatches(typed: string, expected: string): boolean {
  const normalisedExpected = normaliseTypedName(expected);
  return normalisedExpected !== '' && normaliseTypedName(typed) === normalisedExpected;
}
