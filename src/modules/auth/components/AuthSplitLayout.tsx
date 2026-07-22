import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { Link } from '@/i18n/navigation';
import { Logo } from '@/modules/design-system';

const BENEFIT_KEYS = ['benefitTests', 'benefitScores', 'benefitFeedback'] as const;

interface AuthSplitLayoutProps {
  children: ReactNode;
}

// Login split layout (design spec 06 §1.1): a 560px navy brand panel pinning its
// logo / copy / legal line top-centre-bottom, beside the 420px form column
// centred in the remaining width. The panel is hidden <1024px — mobile falls
// back to the form column alone, which carries its own logo lockup. The comp's
// Parent/School segmented toggle is intentionally NOT built (no school portal in
// scope). Server component — static brand copy only.
export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  const t = useTranslations('Auth.split');
  const tHome = useTranslations('Home');

  return (
    <main className="flex flex-1 bg-background">
      <aside className="relative hidden w-auth-wide shrink-0 flex-col justify-between overflow-hidden bg-navy-900 p-14 lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -bottom-40 size-96 rounded-full bg-blue-600/20 blur-3xl"
        />
        <Link
          href="/"
          className="relative self-start rounded-sm transition-transform duration-200 ease-out-expo hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-on-dark motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <Logo theme="white" alt={tHome('footer.logoAlt')} height={40} />
        </Link>
        <div className="relative flex flex-col gap-5">
          <p className="animate-in text-h1 font-bold text-balance text-white duration-700 ease-out-expo fill-mode-both fade-in slide-in-from-bottom-4 motion-reduce:animate-none">
            {t('title')}
          </p>
          <p className="max-w-sm animate-in text-body-lg text-navy-body delay-100 duration-700 ease-out-expo fill-mode-both fade-in slide-in-from-bottom-4 motion-reduce:animate-none">
            {t('body')}
          </p>
          <ul className="mt-2 flex flex-col gap-3">
            {BENEFIT_KEYS.map((key, index) => (
              <li
                key={key}
                style={{ animationDelay: `${200 + index * 90}ms` }}
                className="flex animate-in items-center gap-2.5 text-body-md text-navy-soft duration-700 ease-out-expo fill-mode-both fade-in slide-in-from-bottom-4 motion-reduce:animate-none"
              >
                <span
                  aria-hidden="true"
                  className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white"
                >
                  <Check strokeWidth={3} className="size-3" />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
        {/* The design's #5E729E footnote is 3.19:1 on navy — --color-navy-muted
            is the nearest token that clears AA (5.3:1) at this size. */}
        <p className="relative text-meta text-navy-muted">{t('legal')}</p>
      </aside>
      <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
        <div className="w-full max-w-auth">{children}</div>
      </div>
    </main>
  );
}
