// `wrap` is opt-in per instance: only the five-step pilot flow is long enough to need a
// second row, and switching it on for the pre-existing three-step hero flow would push it
// from one row to two between 640px and 1023px.
interface HeroFlowProps {
  titleKey?: string;
  steps?: readonly string[];
  wrap?: boolean;
  className?: string;
}

// Which illustrative block a USP card shows. 'llm' is USP 02's export row, 'audiences' is
// USP 05's three audience views; every other USP shows none.
type PilotUspDetailKind = 'llm' | 'audiences';

interface PilotUspDetailProps {
  detail: PilotUspDetailKind;
}

export type { HeroFlowProps, PilotUspDetailKind, PilotUspDetailProps };
