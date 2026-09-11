'use client';

import { CircleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import {
  CANCEL_CLASS,
  CTA_CLASS,
  FOCUS_RING_CLASS,
} from '@/modules/teacher/constants/start-session-styles.constants';

/**
 * The CTA and Cancel (`:1592–1597`). A CTA that cannot go keeps the design's
 * greyed, still-focusable look (aria-disabled, no-op); a refusal from the server
 * is printed above it as the server said it.
 */
function ModalFooter({
  label,
  canSubmit,
  isBusy,
  onSubmit,
  onCancel,
  error,
  note,
}: {
  label: string;
  canSubmit: boolean;
  isBusy: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  error: string | null;
  note: string | null;
}) {
  const t = useTranslations('TeacherPortal.startSession.cta');
  return (
    <div data-slot="start-session-footer" className="mt-[26px]">
      {error ? (
        <p role="alert" data-slot="start-session-error" className="mb-3 flex items-start gap-2 text-[13px] leading-[1.45] font-semibold text-[#B42318]">
          <CircleAlert aria-hidden="true" className="mt-px size-[15px] shrink-0" />
          {error}
        </p>
      ) : null}
      {note ? <p className="mb-3 text-[13px] leading-[1.5] text-[#6B7280]">{note}</p> : null}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          data-slot="start-session-cta"
          aria-disabled={canSubmit ? undefined : true}
          aria-busy={isBusy || undefined}
          onClick={onSubmit}
          className={cn(
            CTA_CLASS,
            FOCUS_RING_CLASS,
            canSubmit ? 'cursor-pointer bg-navy-900 hover:bg-navy-800' : 'cursor-not-allowed bg-[#C4CEDC]',
          )}
        >
          {label}
        </button>
        <button type="button" onClick={onCancel} className={cn(CANCEL_CLASS, FOCUS_RING_CLASS)}>
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}

export { ModalFooter };
