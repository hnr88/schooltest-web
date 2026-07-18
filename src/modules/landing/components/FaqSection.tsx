import { getTranslations } from 'next-intl/server';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Container,
  Section,
} from '@/modules/design-system';
import { FAQ_ITEMS } from '@/modules/landing/constants/landing.constants';

async function FaqSection() {
  const t = await getTranslations('Home');

  return (
    <Section id="resources">
      <Container className="max-w-3xl">
        <h2 className="text-center text-h2 font-bold text-balance">
          {t('faq.title')}
        </h2>
        <div className="mt-10 rounded-2xl border border-border bg-card px-2 py-1">
          <Accordion defaultValue={[FAQ_ITEMS[0].value]}>
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.value} value={item.value}>
                <AccordionTrigger className="py-4 text-left text-base font-semibold">
                  {t(item.questionKey)}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {t(item.answerKey)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </Section>
  );
}

export { FaqSection };
