import type { KeyTakeawaysSectionProps } from '@/modules/cms/types/components.types';

function KeyTakeawaysSection({ section }: KeyTakeawaysSectionProps) {
  if (section.items.length === 0) return null;
  return (
    <aside className="rounded-card bg-surface-inset p-5">
      {section.title ? <h2 className="text-h4 font-semibold text-foreground">{section.title}</h2> : null}
      <ul className="mt-3 ml-5 flex list-disc flex-col gap-2">
        {section.items.map((item) => (
          <li key={item.text} className="text-body-md leading-relaxed text-body">
            {item.text}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export { KeyTakeawaysSection };
