import { BlocksContent } from '@/modules/cms/components/BlocksContent';
import type { FaqListSectionProps } from '@/modules/cms/types/components.types';

// Native <details>: keyboard and screen-reader accessible with zero client JS.
function FaqListSection({ section }: FaqListSectionProps) {
  if (section.faqs.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      {section.title ? <h2 className="text-h4 font-semibold text-foreground">{section.title}</h2> : null}
      <div className="flex flex-col divide-y divide-border rounded-card border border-border">
        {section.faqs.map((faq) => (
          <details key={faq.question} className="group p-4">
            <summary className="min-h-11 cursor-pointer text-body-md font-medium text-foreground">
              {faq.question}
            </summary>
            <div className="mt-2">
              <BlocksContent blocks={faq.answer} />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

export { FaqListSection };
