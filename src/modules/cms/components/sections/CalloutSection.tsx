import { cn } from '@/lib/utils';
import { BlocksContent } from '@/modules/cms/components/BlocksContent';
import { CALLOUT_TONE_CLASSES } from '@/modules/cms/constants/components.constants';
import type { CalloutSectionProps } from '@/modules/cms/types/components.types';

function CalloutSection({ section }: CalloutSectionProps) {
  return (
    <aside
      role="note"
      data-tone={section.tone}
      className={cn('rounded-card border-l-4 p-5', CALLOUT_TONE_CLASSES[section.tone])}
    >
      {section.title ? <p className="text-body-md font-semibold text-foreground">{section.title}</p> : null}
      <div className={section.title ? 'mt-2' : undefined}>
        <BlocksContent blocks={section.body} />
      </div>
    </aside>
  );
}

export { CalloutSection };
