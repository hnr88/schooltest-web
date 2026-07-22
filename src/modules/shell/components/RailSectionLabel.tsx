import { cn } from '@/lib/utils';

// Group overline, verbatim from the detached rail slice (.qa/design/spec/01 §1.2,
// portal--detached-sidebar.html:4 / :17): `font-size:11px; font-weight:600;
// letter-spacing:.08em; text-transform:uppercase; padding:0 14px 8px`.
// The slice's #9AA6B8 measures 2.46:1 on the white card, so the ink is
// --muted-foreground (4.76:1) — the label is decorative-adjacent but still read.
function RailSectionLabel({ children, className }: { children: string; className?: string }) {
  return (
    <span
      data-slot="nav-group-label"
      className={cn(
        'px-3.5 pb-2 text-micro font-semibold tracking-rail text-muted-foreground uppercase group-data-[collapsible=icon]:hidden',
        className,
      )}
    >
      {children}
    </span>
  );
}

export { RailSectionLabel };
