// SECTION OVERLINES extend canonical (the white rail has zero in 20 instances) —
// geometry is verbatim from the navy rail's overline (11px / 700 / .08em /
// padding:0 12px 6px) and the ink is substituted to #64748B because both canonical
// candidates fail AA on white. They are TRIVIALLY REMOVABLE: delete the two
// RailSectionLabel calls (and the two i18n keys) and the canonical #EEF2F7 divider
// still segments the rail with nothing else lost.
function RailSectionLabel({ children }: { children: string }) {
  return (
    <span
      data-slot="nav-group-label"
      className="px-3 pb-1.5 text-micro font-bold tracking-rail text-muted-foreground uppercase group-data-[collapsible=icon]:hidden"
    >
      {children}
    </span>
  );
}

export { RailSectionLabel };
