interface HeroFlowProps {
  titleKey?: string;
  steps?: readonly string[];
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
