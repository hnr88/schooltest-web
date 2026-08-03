import { getFormatter, getTranslations } from 'next-intl/server';

import { Container } from '@/modules/design-system';
import { EaldFooter, EaldHeader } from '@/modules/eald';
import { LegalSection } from '@/modules/legal/components/LegalSection';
import { LegalTableOfContents } from '@/modules/legal/components/LegalTableOfContents';
import { PublicBreadcrumb } from '@/modules/navigation';
import { BreadcrumbJsonLd, PublicPageJsonLd } from '@/modules/seo';
import type { LegalDocument } from '@/modules/legal/types/legal.types';

interface LegalDocumentScreenProps {
  readonly document: LegalDocument;
  readonly pathname: string;
  readonly locale: string;
}

// Public legal page shell: the same header/footer chrome as the marketing
// surface, the shared breadcrumb + BreadcrumbList JSON-LD, then the document
// itself. Every word of the body comes from the C-LEG-02 response — no copy is
// hardcoded here; only the chrome labels are translated.
async function LegalDocumentScreen({ document, pathname, locale }: LegalDocumentScreenProps) {
  const t = await getTranslations('Legal');
  const format = await getFormatter({ locale });
  const effective = format.dateTime(new Date(document.effective_date), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EaldHeader />
      <BreadcrumbJsonLd pathname={pathname} locale={locale} currentLabel={document.title} />
      <PublicPageJsonLd
        pathname={pathname}
        locale={locale}
        title={document.title}
        description={document.summary ?? document.title}
        datePublished={document.effective_date}
        dateModified={document.updatedAt}
      />
      <PublicBreadcrumb pathname={pathname} currentLabel={document.title} />
      <main id="main-content">
        <Container className="max-w-3xl pt-4 pb-16">
          <header className="border-b border-border pb-6">
            <h1 className="text-h2 font-semibold text-foreground">{document.title}</h1>
            {document.summary ? (
              <p className="mt-3 text-body-lg leading-relaxed text-body">{document.summary}</p>
            ) : null}
            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-body-sm text-body">
              <div className="flex gap-2">
                <dt className="font-medium text-foreground">{t('effectiveDate')}</dt>
                <dd>
                  <time dateTime={document.effective_date}>{effective}</time>
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-foreground">{t('version')}</dt>
                <dd>{document.version}</dd>
              </div>
            </dl>
          </header>

          <LegalTableOfContents sections={document.sections} />

          <div className="mt-10 flex flex-col gap-10">
            {document.sections.map((section) => (
              <LegalSection key={section.id} section={section} />
            ))}
          </div>
        </Container>
      </main>
      <EaldFooter />
    </div>
  );
}

export { LegalDocumentScreen };
