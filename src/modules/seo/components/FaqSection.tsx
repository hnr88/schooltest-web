import type { FaqSectionProps } from '@/modules/seo/types/components.types';

// Server Component. The visible FAQ that the page's FAQPage JSON-LD describes:
// both are rendered from the same entries, and each question carries the
// `#faq-<key>` anchor its Question node's @id points at.
function FaqSection({ heading, intro, entries }: FaqSectionProps) {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="scroll-mt-5 border-t border-surface-inset bg-surface-hover"
    >
      <div className="mx-auto max-w-eald px-6 py-16 sm:px-8">
        <h2
          id="faq-heading"
          className="text-[32px] leading-[1.16] font-bold tracking-[-0.024em] text-navy-900 text-balance"
        >
          {heading}
        </h2>
        <p className="mt-4 max-w-[60ch] text-[16px] leading-[1.7] text-body">{intro}</p>
        <div className="mt-10 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {entries.map((entry) => (
            <div key={entry.key} id={`faq-${entry.key}`} className="scroll-mt-24">
              <h3 className="text-[18px] leading-[1.35] font-semibold text-navy-900">
                {entry.question}
              </h3>
              <p className="mt-3 text-[15.5px] leading-[1.7] text-body">{entry.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export { FaqSection };
