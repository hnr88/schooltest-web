export interface RevealAuditEntry {
  student_documentId: string;
  revealed_at: string;
}

export interface RevealAuditState {
  entries: Record<string, RevealAuditEntry[]>;
  recordReveal: (sittingDocumentId: string, studentDocumentId: string) => void;
}
