import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { FLOW_STEPS } from '@/modules/landing/constants/landing.constants';

async function HeroFlow() {
  const t = await getTranslations('Home');

  return (
    <div className="mx-auto max-w-4xl px-6 pt-16 text-center sm:pt-24">
      <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl">
        {t.rich('flow.title', {
          blue: (chunks) => <span className="text-blue-600 dark:text-blue-400">{chunks}</span>,
          teal: (chunks) => <span className="text-teal-600 dark:text-teal-400">{chunks}</span>,
        })}
      </h2>
      <ol className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-9">
        {FLOW_STEPS.map((key, index) => (
          <li key={key} className="flex items-center gap-4 sm:gap-9">
            <span className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-full bg-blue-50 text-sm font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                {index + 1}
              </span>
              <span className="text-sm font-semibold text-foreground">{t(key)}</span>
            </span>
            {index < FLOW_STEPS.length - 1 ? (
              <ArrowRight
                aria-hidden="true"
                className="hidden size-5 text-slate-300 sm:block dark:text-slate-600"
              />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

export { HeroFlow };
