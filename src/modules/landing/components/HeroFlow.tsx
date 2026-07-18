import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { FLOW_STEPS } from '@/modules/landing/constants/landing.constants';

async function HeroFlow() {
  const t = await getTranslations('Home');

  return (
    <div className="relative border-t border-white/10 px-6 py-12 sm:px-12">
      <h2 className="mx-auto max-w-2xl text-center text-2xl font-bold text-balance text-white sm:text-3xl">
        {t.rich('flow.title', {
          blue: (chunks) => <span className="text-blue-300">{chunks}</span>,
          teal: (chunks) => <span className="text-teal-500">{chunks}</span>,
        })}
      </h2>
      <ol className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
        {FLOW_STEPS.map((key, index) => (
          <li key={key} className="flex items-center gap-4 sm:gap-6">
            <span className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-full bg-white/10 text-sm font-semibold text-white">
                {index + 1}
              </span>
              <span className="text-sm font-semibold text-white">{t(key)}</span>
            </span>
            {index < FLOW_STEPS.length - 1 ? (
              <ArrowRight aria-hidden="true" className="hidden size-5 text-white/40 sm:block" />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

export { HeroFlow };
