import type { HowToSectionProps } from '@/modules/seo/types/components.types';

// Server Component. The visible ordered step flow the page's HowTo JSON-LD
// describes; each <li> carries the `#step-<key>` anchor its HowToStep links to.
function HowToSection({ heading, intro, steps }: HowToSectionProps) {
  return (
    <section
      id="how-to-start"
      aria-labelledby="how-to-start-heading"
      className="scroll-mt-5 border-t border-surface-inset bg-background"
    >
      <div className="mx-auto max-w-eald px-6 py-16 sm:px-8">
        <h2
          id="how-to-start-heading"
          className="text-[32px] leading-[1.16] font-bold tracking-[-0.024em] text-navy-900 text-balance"
        >
          {heading}
        </h2>
        <p className="mt-4 max-w-[60ch] text-[16px] leading-[1.7] text-body">{intro}</p>
        <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.key}
              id={`step-${step.key}`}
              className="scroll-mt-24 rounded-2xl border border-surface-inset bg-surface-hover p-6"
            >
              <span aria-hidden="true" className="text-[13px] font-bold tracking-[.12em] text-teal-700">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 text-[18px] leading-[1.35] font-semibold text-navy-900">
                {step.name}
              </h3>
              <p className="mt-2 text-[15px] leading-[1.65] text-body">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export { HowToSection };
