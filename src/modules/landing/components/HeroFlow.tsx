import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { cn } from '@/lib/utils';
import { FLOW_STEPS } from '@/modules/landing/constants/landing.constants';
import type { HeroFlowProps } from '@/modules/landing/types/landing.types';

function FlowArrow() {
  return (
    <ArrowRight
      aria-hidden="true"
      className="hidden size-5 text-slate-300 sm:block dark:text-slate-600"
    />
  );
}

async function HeroFlow({
  titleKey = 'flow.title',
  steps = FLOW_STEPS,
  wrap = false,
  className,
}: HeroFlowProps) {
  const t = await getTranslations('Home');

  return (
    <div className={cn('mx-auto max-w-4xl px-6 text-center', className)}>
      <h2 className="mx-auto max-w-2xl text-2xl font-bold text-balance text-foreground sm:text-flow">
        {t.rich(titleKey, {
          blue: (chunks) => <span className="text-blue-600 dark:text-blue-400">{chunks}</span>,
          teal: (chunks) => <span className="text-teal-600 dark:text-teal-400">{chunks}</span>,
        })}
      </h2>
      <ol
        className={cn(
          'mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-9',
          wrap && 'sm:flex-wrap',
        )}
      >
        {steps.map((key, index) => (
          <li key={key} className="flex items-center gap-4 sm:gap-9">
            {wrap && index > 0 ? <FlowArrow /> : null}
            <span className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-full bg-blue-50 text-sm font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                {index + 1}
              </span>
              <span className="text-sm font-semibold text-foreground">{t(key)}</span>
            </span>
            {!wrap && index < steps.length - 1 ? <FlowArrow /> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

export { HeroFlow };
