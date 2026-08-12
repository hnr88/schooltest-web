import { Container, Section } from '@/modules/design-system';
import { HeroFlow } from '@/modules/landing/components/HeroFlow';
import { ScrollReveal } from '@/modules/landing/components/ScrollReveal';
import { TestimonialCard } from '@/modules/landing/components/TestimonialCard';
import { PILOT_FLOW_STEPS } from '@/modules/landing/constants/landing.constants';

async function WhySchoolsSection() {
  return (
    <Section id="why-schools">
      <ScrollReveal>
        <HeroFlow titleKey="pilot.whyTitle" steps={PILOT_FLOW_STEPS} wrap />
      </ScrollReveal>
      <Container className="mt-12 max-w-3xl">
        <ScrollReveal delay={100} variant="scale">
          <TestimonialCard
            quoteKey="pilot.testimonialQuote"
            roleKey="pilot.testimonialAttribution"
            nameKey={null}
            initials={null}
            showRating={false}
          />
        </ScrollReveal>
      </Container>
    </Section>
  );
}

export { WhySchoolsSection };
