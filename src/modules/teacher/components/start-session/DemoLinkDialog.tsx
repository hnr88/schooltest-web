'use client';

import { useState } from 'react';
import { CircleAlert, Link2 } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { OpsDialog, OpsDialogContent, OpsDialogDescription, OpsDialogTitle } from '@/modules/design-system';
import {
  DEMO_LINK_EXPIRY_FORMAT,
  DEMO_LINK_PANEL_CLASS,
  FOCUS_RING_CLASS,
} from '@/modules/teacher/constants/start-session-styles.constants';
import { useStartSessionStore } from '@/modules/teacher/stores/use-start-session-store';

// "Your demo link is ready" (design S29, `Teacher Portal v2.dc.html:1601–1625`),
// mounted once beside the Start-a-session modal. Every value is the server's:
// the URL is the single-use token C-TT-DEMO minted, and the expiry is the token
// row's own `expires_at` — the design's "expires when you close the demo" is not
// what the API does, so the dialog says what the API does.
function DemoLinkDialog() {
  const t = useTranslations('TeacherPortal.startSession.demoLink');
  const format = useFormatter();
  const demoLink = useStartSessionStore((state) => state.demoLink);
  const clear = useStartSessionStore((state) => state.clearDemoLink);
  // Keyed by the URL, not a boolean: every mint is a new single-use token, so a
  // second demo link starts on "Copy link" without an effect resetting anything.
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const copied = demoLink !== null && copiedUrl === demoLink.link.web_url;

  return (
    <OpsDialog
      open={demoLink !== null}
      onOpenChange={(open) => {
        if (!open) clear();
      }}
    >
      <OpsDialogContent data-surface="demo-link-dialog" className={DEMO_LINK_PANEL_CLASS}>
        {demoLink === null ? null : (
          <>
            <div className="flex items-start gap-3.5">
              <div className="flex size-[46px] flex-none items-center justify-center rounded-[12px] bg-[#EEF4FF]">
                <Link2 aria-hidden="true" className="size-6 text-[#2563EB]" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <OpsDialogTitle className="m-0 text-[20px] font-bold text-navy-900">{t('title')}</OpsDialogTitle>
                <OpsDialogDescription className="mt-1 text-[13.5px] leading-[1.55] text-[#5B6472]">
                  {t('subtitle', { test: demoLink.testLabel })}
                </OpsDialogDescription>
              </div>
            </div>

            <div className="mt-[18px] flex items-center gap-2 rounded-[12px] border-[1.5px] border-[#DBE3EF] bg-[#F4F7FC] py-1.5 pr-1.5 pl-3.5">
              <span
                data-slot="demo-link-url"
                className="min-w-0 flex-1 truncate font-mono text-[13.5px] font-semibold text-[#16326E]"
              >
                {demoLink.link.web_url}
              </span>
              <button
                type="button"
                data-slot="demo-link-copy"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(demoLink.link.web_url)
                    .then(() => setCopiedUrl(demoLink.link.web_url));
                }}
                className={cn(
                  FOCUS_RING_CLASS,
                  'h-[38px] flex-none cursor-pointer rounded-[9px] bg-[#16326E] px-4 text-[13px] font-bold text-white',
                )}
              >
                {t(copied ? 'copied' : 'copy')}
              </button>
            </div>

            <p className="mt-[18px] flex items-start gap-2.5 rounded-[10px] border border-[#FBD9A8] bg-[#FFF7ED] px-3.5 py-[11px] text-[12.5px] leading-[1.5] text-[#9A5B12]">
              <CircleAlert aria-hidden="true" className="mt-px size-4 flex-none text-[#C2740C]" strokeWidth={2.2} />
              {t('warning', {
                expires: format.dateTime(new Date(demoLink.link.expires_at), DEMO_LINK_EXPIRY_FORMAT),
              })}
            </p>

            <div className="mt-[18px] flex flex-wrap items-center gap-2.5">
              <a
                href={demoLink.link.web_url}
                target="_blank"
                rel="noreferrer"
                data-slot="demo-link-open"
                className={cn(
                  FOCUS_RING_CLASS,
                  'flex h-12 items-center rounded-[10px] bg-[#2563EB] px-6 text-[14.5px] font-bold text-white',
                )}
              >
                {t('open')}
              </a>
              <button
                type="button"
                onClick={clear}
                className={cn(
                  FOCUS_RING_CLASS,
                  'h-12 cursor-pointer rounded-[10px] border border-[#E5E7EB] bg-white px-5 text-[14px] font-semibold text-navy-900 hover:border-navy-900',
                )}
              >
                {t('done')}
              </button>
            </div>
          </>
        )}
      </OpsDialogContent>
    </OpsDialog>
  );
}

export { DemoLinkDialog };
