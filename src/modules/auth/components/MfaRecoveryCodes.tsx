'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';

interface MfaRecoveryCodesProps {
  codes: string[];
  onAcknowledge: () => void;
}

// W3-22 (D3 MFA-3): the eight recovery codes, shown exactly once. The only way
// off this screen is the explicit acknowledgement; the codes live in the
// parent's memory and are cleared when it fires. A reload would lose them, so
// the browser's leave-page prompt is armed while they are on screen.
export function MfaRecoveryCodes({ codes, onAcknowledge }: MfaRecoveryCodesProps) {
  const t = useTranslations('Auth');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div data-slot="mfa-recovery-codes" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-[15px] font-semibold text-[#0E2350]">{t('mfaRecoveryTitle')}</h3>
        <p className="text-sm leading-[1.6] text-[#64748B]">{t('mfaRecoveryBody')}</p>
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {codes.map((code) => (
          <li
            key={code}
            className="rounded-[10px] border border-[#CBD5E1] bg-[#F7F9FC] px-3 py-2 text-center font-mono text-[15px] tracking-[0.08em] text-[#0E2350]"
          >
            {code}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={() => void copy()}>
          {copied ? t('mfaRecoveryCopied') : t('mfaRecoveryCopy')}
        </Button>
        <Button type="button" onClick={onAcknowledge}>
          {t('mfaRecoveryAck')}
        </Button>
      </div>
    </div>
  );
}
