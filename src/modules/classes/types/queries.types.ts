// C-CLS-02 body. `year_band` is optional server-side (only `name` is required),
// and the spec §2 add-class modal has no year band field — omitting the key
// leaves the band unset rather than inventing one.
export interface CreateClassInput {
  name: string;
  year_band?: string;
  teacher_documentIds: string[];
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
}
