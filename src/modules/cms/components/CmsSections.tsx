import { CalloutSection } from '@/modules/cms/components/sections/CalloutSection';
import { ContactBlockSection } from '@/modules/cms/components/sections/ContactBlockSection';
import { CtaSection } from '@/modules/cms/components/sections/CtaSection';
import { FaqListSection } from '@/modules/cms/components/sections/FaqListSection';
import { HeadingTextSection } from '@/modules/cms/components/sections/HeadingTextSection';
import { KeyTakeawaysSection } from '@/modules/cms/components/sections/KeyTakeawaysSection';
import { MediaSection } from '@/modules/cms/components/sections/MediaSection';
import { RichTextSection } from '@/modules/cms/components/sections/RichTextSection';
import type { CmsSection } from '@/modules/cms/types/cms.types';
import type { CmsSectionsProps } from '@/modules/cms/types/components.types';

// The section registry: one component per dynamic-zone component, keyed by
// Strapi's own `__component` (the park `renderPageSections` registry, keyed
// natively instead of through a section-type relation). An unknown type
// renders nothing rather than breaking the page.
function renderSection(section: CmsSection) {
  switch (section.__component) {
    case 'sections.rich-text':
      return <RichTextSection section={section} />;
    case 'sections.heading-text':
      return <HeadingTextSection section={section} />;
    case 'sections.faq-list':
      return <FaqListSection section={section} />;
    case 'sections.key-takeaways':
      return <KeyTakeawaysSection section={section} />;
    case 'sections.callout':
      return <CalloutSection section={section} />;
    case 'sections.media':
      return <MediaSection section={section} />;
    case 'sections.cta':
      return <CtaSection section={section} />;
    case 'sections.contact-block':
      return <ContactBlockSection section={section} />;
    default:
      return null;
  }
}

function CmsSections({ sections }: CmsSectionsProps) {
  return (
    <div className="flex flex-col gap-10" data-testid="cms-sections">
      {sections.map((section) => (
        <div key={`${section.__component}-${section.id}`} data-section={section.__component}>
          {renderSection(section)}
        </div>
      ))}
    </div>
  );
}

export { CmsSections };
