import { Container, Section } from '@/modules/design-system';
import { ScrollReveal } from '@/modules/landing';
import type { QuoteBandProps } from '@/modules/eald/types/eald.types';

function QuoteBand({ quote }: QuoteBandProps) {
  return (
    <Section>
      <Container className="max-w-eald">
        <ScrollReveal variant="scale">
          <div className="rounded-4xl bg-navy-900 p-10 sm:p-16">
            <p className="mx-auto max-w-3xl text-center text-h2 font-bold text-white">
              {quote}
            </p>
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  );
}

export { QuoteBand };
