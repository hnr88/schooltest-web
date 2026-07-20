import { getTranslations } from 'next-intl/server';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Container,
  Section,
} from '@/modules/design-system';
import { ScrollReveal } from '@/modules/landing/components/ScrollReveal';
import { FAQ_ITEMS } from '@/modules/landing/constants/landing.constants';

async function FaqSection() {
  const t = await getTranslations('Home');

  return (
    <Section id="resources">
      <ScrollReveal>
        <Container className="max-w-3xl">
          <h2 className="text-center text-h2 font-bold text-balance">{t('faq.title')}</h2>
          <div className="mt-10 rounded-2xl border border-border bg-card px-1 py-2">
            <Accordion defaultValue={[FAQ_ITEMS[0].value]}>
              {FAQ_ITEMS.map((item) => (
                <AccordionItem key={item.value} value={item.value}>
                  <AccordionTrigger className="px-5.5 py-4.5 text-left text-base font-semibold">
                    {t(item.questionKey)}
                  </AccordionTrigger>
                  <AccordionContent className="px-5.5 pb-5 text-sm leading-relaxed text-muted-foreground">
                    {t(item.answerKey)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Container>
      </ScrollReveal>
    </Section>
  );
}

export { FaqSection };
