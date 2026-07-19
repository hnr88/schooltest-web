import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { Logo } from '@/modules/design-system';

const BENEFIT_KEYS = ['benefitTests', 'benefitScores', 'benefitFeedback'] as const;

interface AuthSplitLayoutProps {
  children: ReactNode;
}

// §14.1 split-panel (C-UI-AUTH-PAGES): navy brand panel on the left (hidden
// <1024px — mobile falls back to the centered card), auth card column on the
// right. The §14.1 comp's Parent/School segmented toggle is intentionally NOT
// built (no school portal in scope). Server component — static brand copy only.
export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  const t = useTranslations('Auth.split');
  const tHome = useTranslations('Home');

  return (
    <main className="grid flex-1 bg-slate-50 lg:grid-cols-[560px_1fr]">
      <aside className="hidden flex-col justify-between gap-12 bg-navy-950 p-14 lg:flex">
        <Logo theme="white" alt={tHome('footer.logoAlt')} height={40} />
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
          <p className="text-4xl font-bold text-balance text-white">{t('title')}</p>
          <p className="text-base text-blue-200">{t('body')}</p>
          <ul className="flex flex-col gap-3">
            {BENEFIT_KEYS.map((key) => (
              <li key={key} className="flex items-center gap-3 text-sm text-blue-100">
                <span
                  aria-hidden="true"
                  className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white"
                >
                  <Check className="size-3.5" />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-slate-400">{t('legal')}</p>
      </aside>
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </main>
  );
}
