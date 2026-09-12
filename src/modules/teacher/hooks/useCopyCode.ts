'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { showOpsToast } from '@/modules/ops/actions';
import { COPY_FLASH_MS } from '@/modules/teacher/constants/live-tab.constants';

/** "Copy code": writes the join code to the clipboard, then reads "Copied" for 1.6 s. */
export function useCopyCode(code: string | null) {
  const t = useTranslations('TeacherPortal.live.room');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), COPY_FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    if (code === null) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      showOpsToast({ tone: 'error', message: t('copyError') });
    }
  };

  return { copied, copy: () => void copy() };
}
