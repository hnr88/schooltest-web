import { getTranslations } from 'next-intl/server';

import { cn } from '@/lib/utils';
import { Container, Logo, Section } from '@/modules/design-system';

const STATS = [
  {
    valueKey: 'stats.deliveredValue',
    labelKey: 'stats.deliveredLabel',
    valueClassName: 'text-white',
  },
  {
    valueKey: 'stats.accuracyValue',
    labelKey: 'stats.accuracyLabel',
    valueClassName: 'text-teal-300',
  },
  {
    valueKey: 'stats.savedValue',
    labelKey: 'stats.savedLabel',
    valueClassName: 'text-blue-300',
  },
] as const;

async function StatsBand() {
  const t = await getTranslations('Home');

  return (
    <Section>
      <Container>
        <div
          data-slot="stats-band"
          className="relative overflow-hidden rounded-4xl bg-navy-900 p-10 sm:p-14"
        >
          <div aria-hidden="true" className="absolute -right-10 -bottom-12 opacity-10">
            <Logo variant="mark" theme="white" alt="" height={220} />
          </div>
          <div className="grid gap-8 text-center text-white sm:grid-cols-3">
            {STATS.map((stat) => (
              <div key={stat.valueKey}>
                <p className={cn('text-5xl font-bold', stat.valueClassName)}>{t(stat.valueKey)}</p>
                <p className="mt-2 text-sm text-slate-400">{t(stat.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

export { StatsBand };
