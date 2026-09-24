import type { CmsBlock, CmsInline } from '@/modules/cms/types/cms-blocks.types';
import type {
  CalloutSection,
  CmsLayout,
  CmsPageList,
  CmsSection,
  CmsTocEntry,
  ContactBlockSection,
  CtaSection,
  FaqListSection,
  HeadingTextSection,
  KeyTakeawaysSection,
  MediaSection,
  ResolvedCmsPage,
  RichTextSection,
} from '@/modules/cms/types/cms.types';

export interface BlocksContentProps {
  readonly blocks: readonly CmsBlock[];
}

export interface InlineContentProps {
  readonly nodes: readonly CmsInline[];
}

export interface CmsSectionsProps {
  readonly sections: readonly CmsSection[];
}

export interface RichTextSectionProps {
  readonly section: RichTextSection;
}
export interface HeadingTextSectionProps {
  readonly section: HeadingTextSection;
}
export interface FaqListSectionProps {
  readonly section: FaqListSection;
}
export interface KeyTakeawaysSectionProps {
  readonly section: KeyTakeawaysSection;
}
export interface CalloutSectionProps {
  readonly section: CalloutSection;
}
export interface MediaSectionProps {
  readonly section: MediaSection;
}
export interface CtaSectionProps {
  readonly section: CtaSection;
}
export interface ContactBlockSectionProps {
  readonly section: ContactBlockSection;
}

export interface CmsTableOfContentsProps {
  readonly entries: readonly CmsTocEntry[];
  readonly title: string;
  readonly label: string;
}

export interface CmsBreadcrumbItem {
  readonly label: string;
  readonly href?: string;
}

export interface CmsBreadcrumbProps {
  readonly items: readonly CmsBreadcrumbItem[];
  readonly label: string;
}

export interface CmsPageScreenProps {
  readonly resolved: ResolvedCmsPage;
}

export interface CmsFooterProps {
  readonly layout: CmsLayout | null;
}

export interface ArticlesIndexScreenProps {
  readonly locale: string;
  readonly list: CmsPageList;
}
