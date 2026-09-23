// C-CLS-02 body. `year_band` is optional server-side (only `name` is required),
// and the spec §2 add-class modal has no year band field — omitting the key
// leaves the band unset rather than inventing one.
export interface CreateClassInput {
  name: string;
  year_band?: string;
  teacher_documentIds: string[];
  // BUG-006: an invitation documentId — sent only when an invited teacher is picked.
  pending_teacher_documentId?: string;
}

// C-CLS-03 body. Every field is optional server-side except the class itself,
// so a caller sends ONLY what it edits: the edit modal sends name + the single
// teacher and deliberately omits `student_documentIds` (whose REPLACE
// semantics would otherwise unlink the roster) and `year_band` (not on that
// modal). The roster is managed by the CSV import, never by class PATCH.
export interface UpdateClassInput {
  documentId: string;
  name: string;
  year_band?: string;
  teacher_documentIds?: string[];
  // BUG-006: set (invitation documentId) or clear (null); omitted = unchanged.
  pending_teacher_documentId?: string | null;
  // BUG-006 follow-up: the explicit consent to remove the class's current
  // teachers when it is put on an invited teacher (the server refuses otherwise).
  replace_teachers?: boolean;
}
