'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { resolveJoinCodeView } from '@/modules/teacher/lib/join-code';
import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';
import { useTeacherTestsQuery } from '@/modules/teacher/queries/use-teacher-tests.query';
import type { JoinCodeView } from '@/modules/teacher/types/join-code.types';

interface JoinCodePanelState {
  view: JoinCodeView;
  isPending: boolean;
  isCopied: boolean;
  copyCode: (code: string) => Promise<void>;
}

/**
 * The join-code panel's brain. Two live reads, no third source of truth: the
 * open sitting comes from C-TD-1 (`GET /api/teacher/dashboard`, scoped to
 * `class.teacher = caller` server-side) and the test's display label from
 * C-TD-2 (`GET /api/teacher/tests`). The create (C-TS-1) already invalidates
 * the `teacher` key, so generating a code re-reads this panel into existence
 * exactly the way a reload does.
 *
 * `isCopied` tracks the code that was copied, not a boolean flag, so generating
 * a NEW code resets the button's label without an effect watching for it.
 */
export function useJoinCodePanel(): JoinCodePanelState {
  const t = useTranslations('Teacher.testSessions.joinCode');
  const dashboard = useTeacherDashboardQuery();
  const tests = useTeacherTestsQuery();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const view = resolveJoinCodeView(dashboard.data?.live_session, tests.data?.tests ?? []);

  // The clipboard write can be refused (permission, insecure context, no API at
  // all). A refusal is reported as a failure — the button never claims a copy
  // it did not make.
  async function copyCode(code: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(t('copyToast', { code }));
    } catch {
      setCopiedCode(null);
      toast.error(t('copyError'));
    }
  }

  return {
    view,
    isPending: dashboard.isPending || tests.isPending,
    isCopied: view.status === 'ready' && copiedCode === view.code,
    copyCode,
  };
}
