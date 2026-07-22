import { Separator } from '@/modules/design-system';

interface AuthDividerProps {
  label: string;
}

// "or" rule between the social button and the credential form (spec 06 §1.1:4).
export function AuthDivider({ label }: AuthDividerProps) {
  return (
    <div aria-hidden="true" className="flex items-center gap-3.5">
      <Separator className="flex-1" />
      {/* The design's #94A3B8 divider label is 2.6:1 on the page — below AA.
          muted-foreground only clears a razor-thin 4.51:1 on --background
          (measures 4.44:1 whenever axe samples mid entrance-fade); text-body
          keeps the same quiet role while clearing ~7.19:1 with real margin. */}
      <span className="text-meta text-body">{label}</span>
      <Separator className="flex-1" />
    </div>
  );
}
