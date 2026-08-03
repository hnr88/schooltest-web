import type { LegalSection as LegalSectionData } from '@/modules/legal/types/legal.types';

interface LegalSectionProps {
  readonly section: LegalSectionData;
}

// One body section of a legal document. Headings are h2 under the document's
// single h1, so the outline stays ordered for screen readers and for the
// heading-order axe rule. Content is rendered as text nodes — never
// dangerouslySetInnerHTML — because the body is structured JSON, not HTML.
function LegalSection({ section }: LegalSectionProps) {
  return (
    <section id={section.id} aria-labelledby={`${section.id}-heading`} className="scroll-mt-24">
      <h2 id={`${section.id}-heading`} className="text-h4 font-semibold text-foreground">
        {section.heading}
      </h2>
      <div className="mt-3 flex flex-col gap-3">
        {section.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 48)} className="text-body-md leading-relaxed text-body">
            {paragraph}
          </p>
        ))}
        {section.list ? (
          <ul className="ml-5 flex list-disc flex-col gap-2">
            {section.list.map((item) => (
              <li key={item.slice(0, 48)} className="text-body-md leading-relaxed text-body">
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

export { LegalSection };
