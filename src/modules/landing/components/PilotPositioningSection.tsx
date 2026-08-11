import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Badge, Button, Container, Eyebrow, Section } from '@/modules/design-system';
import { ScrollReveal } from '@/modules/landing/components/ScrollReveal';
import { PILOT_CAPABILITIES } from '@/modules/landing/constants/landing.constants';

async function PilotPositioningSection() {
  const t = await getTranslations('Home');

  return (
    <Section id="pilot">
      <Container className="max-w-4xl text-center">
        <ScrollReveal>
          <Eyebrow>{t('pilot.eyebrow')}</Eyebrow>
          <h2 className="mt-3 text-h1 font-bold text-balance">{t('pilot.title')}</h2>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {PILOT_CAPABILITIES.map((key) => (
              <li key={key}>
                <Badge variant="outline" className="h-auto px-3.5 py-1.5 text-body-md font-medium">
                  {t(key)}
                </Badge>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex justify-center">
            <Button size="xl" href="#cta">
              {t('pilot.cta')}
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  );
}

export { PilotPositioningSection };
