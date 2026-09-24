import type { ContactBlockSectionProps } from '@/modules/cms/types/components.types';

function ContactBlockSection({ section }: ContactBlockSectionProps) {
  return (
    <section className="rounded-card bg-surface-inset p-5">
      <h2 className="text-h4 font-semibold text-foreground">{section.heading}</h2>
      {section.text ? <p className="mt-2 text-body-md leading-relaxed text-body">{section.text}</p> : null}
      <address className="mt-3 flex flex-col gap-1 not-italic">
        {section.email ? (
          <a href={`mailto:${section.email}`} className="text-body-md text-primary underline underline-offset-2">
            {section.email}
          </a>
        ) : null}
        {section.phone ? (
          <a href={`tel:${section.phone.replace(/\s+/g, '')}`} className="text-body-md text-primary underline underline-offset-2">
            {section.phone}
          </a>
        ) : null}
        {section.note ? <span className="text-body-sm text-body">{section.note}</span> : null}
      </address>
    </section>
  );
}

export { ContactBlockSection };
