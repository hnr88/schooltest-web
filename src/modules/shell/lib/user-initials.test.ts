import { describe, expect, it } from 'vitest';

import { getUserDisplayName, getUserInitials } from '@/modules/shell/lib/user-initials';

import opsMe from './__fixtures__/users-me.apiadmin.json';
import teacherMe from './__fixtures__/users-me.t2.json';

// Both fixtures are GET /api/users/me bodies recorded verbatim from the live API on
// :5500 — t2@schooltest.local (the seeded teacher) and apiadmin@schooltest.local
// (the ops account, which has no first or last name).

describe('getUserDisplayName', () => {
  it('uses the real first and last name the API stores for a teacher', () => {
    expect(teacherMe.role.type).toBe('teacher');
    expect(getUserDisplayName(teacherMe)).toBe(`${teacherMe.first_name} ${teacherMe.last_name}`);
    expect(getUserDisplayName(teacherMe)).not.toBe(teacherMe.username);
  });

  it('falls back to the username only when both names are empty', () => {
    expect(opsMe.first_name).toBeNull();
    expect(opsMe.last_name).toBeNull();
    expect(getUserDisplayName(opsMe)).toBe(opsMe.username);
  });
});

describe('getUserInitials', () => {
  it('gives the teacher card one initial, from the first name', () => {
    expect(getUserInitials(getUserDisplayName(teacherMe), 1)).toBe(
      teacherMe.first_name.charAt(0).toUpperCase(),
    );
  });

  it('keeps two initials by default for every other card', () => {
    expect(getUserInitials(getUserDisplayName(teacherMe))).toBe(
      `${teacherMe.first_name.charAt(0)}${teacherMe.last_name.charAt(0)}`.toUpperCase(),
    );
    expect(getUserInitials(opsMe.username)).toBe(opsMe.username.charAt(0).toUpperCase());
  });
});
