export interface CmsTextNode {
  readonly type: 'text';
  readonly text: string;
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly underline?: boolean;
  readonly strikethrough?: boolean;
  readonly code?: boolean;
}

export interface CmsLinkNode {
  readonly type: 'link';
  readonly url: string;
  readonly children: readonly CmsTextNode[];
}

export type CmsInline = CmsTextNode | CmsLinkNode;

export interface CmsListItem {
  readonly type: 'list-item';
  readonly children: readonly CmsInline[];
}

export interface CmsList {
  readonly type: 'list';
  readonly format: 'ordered' | 'unordered';
  readonly children: readonly (CmsListItem | CmsList)[];
}

export type CmsBlock =
  | { readonly type: 'paragraph'; readonly children: readonly CmsInline[] }
  | { readonly type: 'heading'; readonly level: number; readonly children: readonly CmsInline[] }
  | CmsList
  | { readonly type: 'quote'; readonly children: readonly CmsInline[] }
  | { readonly type: 'code'; readonly children: readonly CmsInline[] }
  | {
      readonly type: 'image';
      readonly image: {
        readonly url: string;
        readonly alternativeText?: string | null;
        readonly width?: number | null;
        readonly height?: number | null;
      };
    }
  | { readonly type: 'unknown' };
