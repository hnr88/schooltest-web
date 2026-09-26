/** Product-provisional momentum cut (Spec 02 §0.1): growth of at least 5 pts reads "Steady". */
export const MOMENTUM_STEADY_MIN = 5;

/** Product-provisional momentum cut (Spec 02 §0.1): growth of at least 10 pts reads "Accelerating". */
export const MOMENTUM_ACCELERATING_MIN = 10;

/** The breakdown table's SHORT vocab row labels (README §3: "Everyday / Classroom / Academic vocabulary"). */
export const BREAKDOWN_VOCAB_LABEL_KEY: Readonly<Partial<Record<string, string>>> = {
  Vocab_A2: 'TeacherPortal.student.breakdown.vocab.Vocab_A2',
  Vocab_B1: 'TeacherPortal.student.breakdown.vocab.Vocab_B1',
  Vocab_B2: 'TeacherPortal.student.breakdown.vocab.Vocab_B2',
};
