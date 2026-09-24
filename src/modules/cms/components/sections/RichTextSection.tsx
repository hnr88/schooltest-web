import { BlocksContent } from '@/modules/cms/components/BlocksContent';
import type { RichTextSectionProps } from '@/modules/cms/types/components.types';

function RichTextSection({ section }: RichTextSectionProps) {
  return (
    <section>
      <BlocksContent blocks={section.body} />
    </section>
  );
}

export { RichTextSection };
