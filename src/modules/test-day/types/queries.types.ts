export interface CloseReopenInput {
  sittingDocumentId: string;
  action: 'close' | 'reopen';
}

export interface MarkAbsentInput {
  sittingDocumentId: string;
  studentDocumentId: string;
  absent: boolean;
}

export interface ResitInput {
  sittingDocumentId: string;
  studentDocumentId: string;
}
