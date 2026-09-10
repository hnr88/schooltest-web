import { describe, expect, test } from 'vitest';

import {
  evaluateInviteForm,
  inviteDomainHost,
  splitInviteFullName,
} from '@/modules/ops/components/OpsStaffInvitationDialog';

// Task 25 — logic.md#v-invite's five rules and D-12's name split, covered as
// pure functions so this suite never mounts React or hits the network.

describe('splitInviteFullName (D-12)', () => {
  test('splits on the LAST space for a two-word name', () => {
    expect(splitInviteFullName('Priya Raman')).toEqual({ first_name: 'Priya', last_name: 'Raman' });
  });

  test('splits on the LAST space, not the first, for a hyphenated first name', () => {
    expect(splitInviteFullName('Ha-eun Park')).toEqual({ first_name: 'Ha-eun', last_name: 'Park' });
  });

  test('a single token fills BOTH columns, so last_name is never blank', () => {
    expect(splitInviteFullName('Cher')).toEqual({ first_name: 'Cher', last_name: 'Cher' });
  });

  test('blank input splits to two blanks', () => {
    expect(splitInviteFullName('   ')).toEqual({ first_name: '', last_name: '' });
  });
});

describe('inviteDomainHost (D-05)', () => {
  test('derives the host from contact_email', () => {
    expect(inviteDomainHost('admin@riverview.edu.au')).toBe('riverview.edu.au');
  });

  test('no stored contact_email means no host', () => {
    expect(inviteDomainHost(null)).toBeNull();
    expect(inviteDomainHost(undefined)).toBeNull();
  });
});

describe('evaluateInviteForm — logic.md#v-invite', () => {
  const base = {
    email: 'teacher@riverview.edu.au',
    fullName: 'Priya Raman',
    isEdit: false,
    alreadyHasAccess: false,
    domainHost: 'riverview.edu.au',
  };

  test('blank email is a blocking error', () => {
    const rules = evaluateInviteForm({ ...base, email: '' });
    expect(rules.emailError).toBe('required');
  });

  test('malformed email is a blocking error', () => {
    const rules = evaluateInviteForm({ ...base, email: 'not-an-email' });
    expect(rules.emailError).toBe('invalid');
  });

  test('an email that already has access to the school is a blocking error on CREATE', () => {
    const rules = evaluateInviteForm({ ...base, alreadyHasAccess: true });
    expect(rules.emailError).toBe('exists');
  });

  test('edit-access mode does NOT apply the already-has-access rule to the person being edited', () => {
    const rules = evaluateInviteForm({ ...base, alreadyHasAccess: true, isEdit: true });
    expect(rules.emailError).toBeNull();
  });

  test('a host outside the school domain is a non-blocking warning', () => {
    const rules = evaluateInviteForm({ ...base, email: 'teacher@othermail.com' });
    expect(rules.emailError).toBeNull();
    expect(rules.outsideDomain).toBe(true);
  });

  test('a matching host is not a warning', () => {
    const rules = evaluateInviteForm(base);
    expect(rules.outsideDomain).toBe(false);
  });

  test('no domain on file means no warning, and the blocking rules still apply', () => {
    const rules = evaluateInviteForm({ ...base, email: 'teacher@othermail.com', domainHost: null });
    expect(rules.outsideDomain).toBe(false);
    expect(rules.emailError).toBeNull();
  });

  test('a blank name is a non-blocking warning', () => {
    const rules = evaluateInviteForm({ ...base, fullName: '   ' });
    expect(rules.noName).toBe(true);
    expect(rules.emailError).toBeNull();
  });

  test('a filled name carries no warning', () => {
    const rules = evaluateInviteForm(base);
    expect(rules.noName).toBe(false);
  });
});
