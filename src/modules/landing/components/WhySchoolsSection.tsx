import { Container, Section } from '@/modules/design-system';
import { HeroFlow } from '@/modules/landing/components/HeroFlow';
import { ScrollReveal } from '@/modules/landing/components/ScrollReveal';
import { PILOT_FLOW_STEPS } from '@/modules/landing/constants/landing.constants';

async function WhySchoolsSection() {
  return (
    <Section id="why-schools">
      <ScrollReveal>
        <HeroFlow titleKey="pilot.whyTitle" steps={PILOT_FLOW_STEPS} wrap />
      </ScrollReveal>
    </Section>
  );
}

export { WhySchoolsSection };
