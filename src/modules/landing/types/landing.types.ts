// `wrap` is opt-in per instance: only the five-step pilot flow is long enough to need a
// second row, and switching it on for the pre-existing three-step hero flow would push it
// from one row to two between 640px and 1023px.
interface HeroFlowProps {
  titleKey?: string;
  steps?: readonly string[];
  wrap?: boolean;
  className?: string;
}

// `null` opts an attribution element out: the pilot testimonial is attributed to a role,
// not a named person, and the client supplied no star rating for it.
interface TestimonialCardProps {
  quoteKey?: string;
  nameKey?: string | null;
  roleKey?: string;
  initials?: string | null;
  showRating?: boolean;
}

export type { HeroFlowProps, TestimonialCardProps };
