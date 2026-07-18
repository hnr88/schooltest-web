// Landing icons rendered from the exact SVG paths shipped in the authoritative spec
// (`SchoolTest Landing.dc.html`) — lucide's nearest glyphs differ (sparkle shape,
// file-text line count, play triangle, bar-chart axis). Check/X/Star/ArrowRight are
// path-identical to lucide, so those stay on lucide-react. Always decorative:
// the parent carries the accessible name or the text sits alongside.

type LandingIconProps = {
  className?: string;
  strokeWidth?: number;
};

function FileTextIcon({ className, strokeWidth = 2 }: LandingIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

function SparklesIcon({ className, strokeWidth = 2 }: LandingIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z" />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9Z" />
    </svg>
  );
}

function SparkleIcon({ className, strokeWidth = 2 }: LandingIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z" />
    </svg>
  );
}

function BarChartIcon({ className, strokeWidth = 2 }: LandingIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}

function PlayIcon({ className }: LandingIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M7 5.5v13a1 1 0 0 0 1.52.86l10.4-6.5a1 1 0 0 0 0-1.72L8.52 4.64A1 1 0 0 0 7 5.5Z" />
    </svg>
  );
}

export { FileTextIcon, SparklesIcon, SparkleIcon, BarChartIcon, PlayIcon };
