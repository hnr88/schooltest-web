'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import type { ClassSitting } from '../types/test-day.types';

interface CodeRevealCardProps {
  sitting: ClassSitting;
  revealPending: boolean;
  onReveal: () => void;
}

// The access code card (mvp-updates §4.5): hidden by default, the reveal
// action is the teacher's only start control. First reveal mints the code via
// C-SITTING-MINT when the sitting has none yet; a closed sitting disables
// reveal (close blocks join, so a code would be misleading).
export function CodeRevealCard({ sitting, revealPending, onReveal }: CodeRevealCardProps) {
  const t = useTranslations('TestDay.code');
  const [revealed, setRevealed] = useState(false);
  const isOpen = sitting.status === 'open';
  const showCode = revealed && sitting.code !== null;

  function handleReveal() {
    setRevealed(true);
    if (sitting.code === null) onReveal();
  }

  return (
    <section
      data-slot="code-reveal-card"
      aria-label={t('title')}
      className="flex max-w-xl flex-col gap-3 rounded-xl border border-border bg-card px-4 py-4"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        {sitting.form ? (
          <p className="text-sm text-muted-foreground">
            {t('formLine', { formCode: sitting.form.form_code })}
          </p>
        ) : null}
      </div>
      {showCode ? (
        <p
          data-slot="access-code"
          className="text-5xl font-bold tracking-widest text-foreground"
        >
          {sitting.code}
        </p>
      ) : (
        <p
          data-slot="access-code-hidden"
          aria-hidden="true"
          className="text-5xl font-bold tracking-widest text-muted-foreground"
        >
          ••••••••
        </p>
      )}
      <p className="max-w-md text-sm text-body">{t('hint')}</p>
      <div className="flex items-center gap-3">
        {showCode ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 px-4"
            onClick={() => setRevealed(false)}
          >
            {t('hideCta')}
          </Button>
        ) : (
          <Button
            type="button"
            className="min-h-11 px-4"
            disabled={!isOpen}
            loading={revealPending}
            onClick={handleReveal}
          >
            {t('revealCta')}
          </Button>
        )}
      </div>
      {!isOpen ? <p className="text-sm text-muted-foreground">{t('closedNote')}</p> : null}
    </section>
  );
}
