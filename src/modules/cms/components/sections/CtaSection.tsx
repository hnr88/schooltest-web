import { CmsLinkAnchor } from '@/modules/cms/components/CmsLinkAnchor';
import type { CtaSectionProps } from '@/modules/cms/types/components.types';

function CtaSection({ section }: CtaSectionProps) {
  return (
    <section className="rounded-card border border-border p-6">
      <h2 className="text-h4 font-semibold text-foreground">{section.heading}</h2>
      {section.text ? <p className="mt-2 text-body-md leading-relaxed text-body">{section.text}</p> : null}
      <div className="mt-4 flex flex-wrap gap-3">
        {section.primaryLink ? (
          <CmsLinkAnchor
            link={section.primaryLink}
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 font-semibold text-primary-foreground"
          />
        ) : null}
        {section.secondaryLink ? (
          <CmsLinkAnchor
            link={section.secondaryLink}
            className="inline-flex min-h-11 items-center rounded-md border border-border px-5 font-semibold text-foreground"
          />
        ) : null}
      </div>
    </section>
  );
}

export { CtaSection };
