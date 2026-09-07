/**
 * §4.8 — the prototype's `deidentify()`, ported (the task's "Checked: rg
 * deidentify → existing helper" claim proved FALSE — nothing existed in the
 * tree, so this is the port, tested). Replaces the student's full name and
 * first name with "The student" so copied commentary never carries a name.
 * Order matters: the full name goes first so its first-name substring is
 * already gone; the remaining bare first name is then replaced too.
 */
export function deidentify(text: string, studentName: string): string {
  const parts = studentName.trim().split(/\s+/).filter((part) => part.length > 0);
  let out = text;
  if (parts.length > 1) out = out.replaceAll(studentName.trim(), 'The student');
  if (parts.length > 0) {
    const first = parts[0]!;
    out = out.replaceAll(first, 'The student').replaceAll(first.toLowerCase(), 'the student');
  }
  return out;
}
