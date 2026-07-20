import Image from 'next/image';

import { cn } from '@/lib/utils';

import type { LogoProps } from '@/modules/design-system/types/design-system.types';

const LOGO_SOURCES = {
  lockup: { src: '/brand/logo.png', width: 503, height: 160, defaultHeight: 34 },
  mark: { src: '/brand/logo-mark.png', width: 179, height: 119, defaultHeight: 32 },
} as const;

function Logo({ variant = 'lockup', theme = 'color', alt, height, className }: LogoProps) {
  const source = LOGO_SOURCES[variant];
  const resolvedHeight = height ?? source.defaultHeight;
  return (
    <Image
      data-slot="logo"
      src={source.src}
      alt={alt}
      width={Math.round((resolvedHeight * source.width) / source.height)}
      height={resolvedHeight}
      className={cn(
        theme === 'white' && 'brightness-0 invert',
        theme === 'color' && 'dark:brightness-0 dark:invert',
        className,
      )}
    />
  );
}

export { Logo };
