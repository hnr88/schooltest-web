import type { LegalDocument, LegalSection, LegalSection as LegalSectionData } from '@/modules/legal/types/legal.types';

export interface LegalDocumentScreenProps {
  readonly document: LegalDocument;
  readonly pathname: string;
  readonly locale: string;
}

export interface LegalSectionProps {
  readonly section: LegalSectionData;
}

export interface LegalTableOfContentsProps {
  readonly sections: readonly LegalSection[];
}
