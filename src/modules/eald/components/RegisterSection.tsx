'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Container } from '@/modules/design-system';
import { RegisterFormCard } from '@/modules/eald/components/RegisterFormCard';
import { RegisterFoundingCard } from '@/modules/eald/components/RegisterFoundingCard';
import { RegisterSuccessCard } from '@/modules/eald/components/RegisterSuccessCard';

function RegisterSection() {
  const t = useTranslations('Eald');
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="register" data-slot="register" className="scroll-mt-24 py-16 sm:py-20">
      <Container className="max-w-eald">
        <div className="grid items-stretch gap-6 lg:grid-cols-2">
          <RegisterFoundingCard t={t} />
          {submitted ? (
            <RegisterSuccessCard t={t} />
          ) : (
            <RegisterFormCard t={t} onSuccess={() => setSubmitted(true)} />
          )}
        </div>
      </Container>
    </section>
  );
}

export { RegisterSection };
