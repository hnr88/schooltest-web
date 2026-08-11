import type { SessionMissingValueProps } from '@/modules/teacher/types/past-sessions.types';

// C-TS-2 pins `code`, `opened_at` and `variant` as NULLABLE: the list also
// carries sittings created outside C-TS-1, which mint no code, and a form
// outside the A|B pair has no variant. A null is printed as an em dash with a
// screen-reader sentence saying WHICH fact is missing — never a zero, never a
// today's-date guess, never an invented "Test A".
function SessionMissingValue({ label }: SessionMissingValueProps) {
  return (
    <span data-slot="session-missing-value" className="text-muted-foreground">
      <span aria-hidden="true">&mdash;</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export { SessionMissingValue };
