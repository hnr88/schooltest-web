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

// Spec §2 "Tests completed": every student sits TWO reading tests, so a class
// carries a submitted count per test slot, both read from C-RPT-04.
export interface ClassTestCompletion {
  testA: number;
  testB: number;
}

// The rendered "X / Y" pair for that column, one fraction per test slot.
export interface ClassTestCompletionDisplay {
  testA: string;
  testB: string;
}
