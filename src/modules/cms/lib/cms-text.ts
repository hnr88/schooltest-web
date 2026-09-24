import { WORDS_PER_MINUTE } from '@/modules/cms/constants/cms.constants';
import type { CmsBlock, CmsInline, CmsList } from '@/modules/cms/types/cms-blocks.types';
import type { CmsPage, CmsSection, CmsTocEntry } from '@/modules/cms/types/cms.types';

function inlineText(children: readonly CmsInline[]): string {
  return children.map((child) => (child.type === 'text' ? child.text : inlineText(child.children))).join('');
}

function listLines(list: CmsList): string[] {
  return list.children.flatMap((child) =>
    child.type === 'list' ? listLines(child) : [`- ${inlineText(child.children)}`],
  );
}

/** Plain text of a blocks body (llms-full.txt, RSS, reading time). */
export function blocksToText(blocks: readonly CmsBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'list':
          return listLines(block).join('\n');
        case 'image':
        case 'unknown':
          return '';
        default:
          return inlineText(block.children);
      }
    })
    .filter((text) => text.length > 0)
    .join('\n\n');
}

function sectionText(section: CmsSection): string {
  switch (section.__component) {
    case 'sections.rich-text':
      return blocksToText(section.body);
    case 'sections.heading-text':
      return `### ${section.heading}\n\n${blocksToText(section.body)}`;
    case 'sections.callout':
      return [section.title, blocksToText(section.body)].filter(Boolean).join('\n\n');
    case 'sections.key-takeaways':
      return [section.title, ...section.items.map((item) => `- ${item.text}`)].filter(Boolean).join('\n');
    case 'sections.faq-list':
      return section.faqs.map((faq) => `Q: ${faq.question}\n\n${blocksToText(faq.answer)}`).join('\n\n');
    case 'sections.cta':
    case 'sections.contact-block':
      return [section.heading, section.text].filter(Boolean).join('\n\n');
    case 'sections.media':
      return section.caption ?? '';
    default:
      return '';
  }
}

/** The whole page body as plain text. */
export function pageToText(page: Pick<CmsPage, 'sections'>): string {
  return page.sections.map(sectionText).filter((text) => text.length > 0).join('\n\n');
}

export function countWords(text: string): number {
  return text.split(/\s+/u).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

export function readingMinutes(text: string): number {
  return Math.max(1, Math.round(countWords(text) / WORDS_PER_MINUTE));
}

/** Table of contents: every Heading + Text section that has an anchor. */
export function buildToc(sections: readonly CmsSection[]): CmsTocEntry[] {
  return sections.flatMap((section) =>
    section.__component === 'sections.heading-text' && section.anchor
      ? [{ id: section.anchor, text: section.heading }]
      : [],
  );
}
