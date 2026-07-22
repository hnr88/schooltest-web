import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type MediaRatio = 'video' | 'square';

export interface MediaCoverProps {
  /** Real image URL. `null`/`undefined` renders the honest no-image fallback —
   *  never a placeholder photo. */
  src?: string | null;
  alt: string;
  icon?: LucideIcon;
  ratio?: MediaRatio;
  /** Responsive width hint for next/image `fill`. */
  sizes?: string;
  priority?: boolean;
  /** Pills drawn ON the cover (sector, status). Kept out of the image so a missing
   *  image never takes the badges with it. */
  overlayStart?: ReactNode;
  overlayEnd?: ReactNode;
  className?: string;
}

export interface MediaCardProps {
  title: string;
  href?: string;
  cover?: ReactNode;
  badges?: ReactNode;
  description?: string;
  meta?: ReactNode;
  trailing?: ReactNode;
  footer?: ReactNode;
  selected?: boolean;
  className?: string;
}

export interface FilterRailProps {
  title: string;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export interface FilterRailSectionProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export interface MapPanelFrameProps {
  label: string;
  children: ReactNode;
  overlay?: ReactNode;
  footer?: ReactNode;
  sticky?: boolean;
  className?: string;
}
