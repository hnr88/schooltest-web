'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Container, DataPanel } from '@/modules/design-system';
import { RegisterFormCard } from '@/modules/eald/components/RegisterFormCard';
import { RegisterFoundingCard } from '@/modules/eald/components/RegisterFoundingCard';
import { RegisterSuccessCard } from '@/modules/eald/components/RegisterSuccessCard';

function RegisterSection() {
  const t = useTranslations('Eald');
  const [submitted, setSubmitted] = useState(false);

  return (
    <section
      id="register"
      data-slot="register"
      className="scroll-mt-24 border-b border-border bg-muted py-18"
    >
      <Container className="max-w-eald sm:px-8">
        <div className="grid items-stretch gap-12 md:grid-cols-2">
          <RegisterFoundingCard t={t} />
          <DataPanel className="min-w-0 shadow-none">
            <h3 className="bg-navy-900 px-6 py-5 text-overline font-bold tracking-eyebrow text-white uppercase sm:px-7.5">
              {t('home.register.formTitle')}
            </h3>
            {submitted ? (
              <RegisterSuccessCard t={t} />
            ) : (
              <RegisterFormCard t={t} onSuccess={() => setSubmitted(true)} />
            )}
          </DataPanel>
        </div>
      </Container>
    </section>
  );
}

export { RegisterSection };
