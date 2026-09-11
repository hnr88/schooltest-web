import { describe, expect, it } from 'vitest';

import { PARENT_ROLE_TYPE } from '@/modules/auth/constants/hooks.constants';
import {
  OPS_ROLE_TYPE,
  SCHOOL_ADMIN_ROLE_TYPE,
  TEACHER_ROLE_TYPE,
} from '@/modules/auth/constants/role.constants';
import { isTeacherFrame } from '@/modules/shell/lib/teacher-frame';

describe('isTeacherFrame', () => {
  it('a resolved teacher gets the teacher frame on every dashboard route', () => {
    for (const pathname of ['/dashboard/results', '/dashboard/teach/settings', '/dashboard']) {
      expect(isTeacherFrame(TEACHER_ROLE_TYPE, pathname), pathname).toBe(true);
    }
  });

  it('every other resolved role keeps its frame, even on a teacher route', () => {
    for (const role of [SCHOOL_ADMIN_ROLE_TYPE, OPS_ROLE_TYPE, PARENT_ROLE_TYPE, 'ops_support']) {
      for (const pathname of ['/dashboard/school', '/dashboard/results', '/dashboard/teach/notifications']) {
        expect(isTeacherFrame(role, pathname), `${role} on ${pathname}`).toBe(false);
      }
    }
  });

  it('an unresolved role takes the teacher frame on teacher-only routes', () => {
    for (const pathname of [
      '/dashboard/results',
      '/dashboard/results/abc/students/def',
      '/dashboard/test-sessions',
      '/dashboard/test-sessions/xyz',
      '/dashboard/reports/r1',
      '/dashboard/teacher/results/r1/family',
      '/dashboard/teach/classes/abc/test-day',
      '/dashboard/teach/results/abc',
      '/dashboard/teach/run-sheet',
    ]) {
      expect(isTeacherFrame(null, pathname), pathname).toBe(true);
    }
  });

  it('an unresolved role keeps the old frame on shared and other-role routes', () => {
    for (const pathname of [
      '/dashboard',
      '/dashboard/teach/notifications',
      '/dashboard/teach/settings',
      '/dashboard/school',
      '/dashboard/ops/schools',
      // Prefixes match whole segments, never a longer word.
      '/dashboard/results-archive',
    ]) {
      expect(isTeacherFrame(null, pathname), pathname).toBe(false);
    }
  });
});
