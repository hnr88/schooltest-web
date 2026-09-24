import { BlocksContent } from '@/modules/cms/components/BlocksContent';
import type { HeadingTextSectionProps } from '@/modules/cms/types/components.types';

// h2 under the page's single h1; the anchor is the table-of-contents target.
function HeadingTextSection({ section }: HeadingTextSectionProps) {
  const headingId = section.anchor ? `${section.anchor}-heading` : undefined;
  return (
    <section
      id={section.anchor ?? undefined}
      aria-labelledby={headingId}
      className="scroll-mt-24"
    >
      <h2 id={headingId} className="text-h4 font-semibold text-foreground">
        {section.heading}
      </h2>
      <div className="mt-3">
        <BlocksContent blocks={section.body} />
      </div>
    </section>
  );
}

export { HeadingTextSection };
