// C-CLS-01 / C-CHD-01 payload shapes (school admin Classes screen).

export interface ClassTeacher {
  documentId: string;
  // Null for accounts created outside the invitation flow (e.g. seeds).
  first_name: string | null;
  last_name: string | null;
}

export interface SchoolClass {
  documentId: string;
  name: string;
  year_band: string | null;
  teachers: ClassTeacher[];
  student_count: number;
}

// Student option for the edit-dialog student picker (C-CHD-01 row projection).
export interface ClassStudentOption {
  documentId: string;
  given_name: string;
  family_name: string;
  status: string;
  class: { documentId: string; name: string } | null;
}
