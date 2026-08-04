import Image from 'next/image';

import { cn } from '@/lib/utils';
import { LOGO_SOURCES } from '@/modules/design-system/constants/logo.constants';

import type { LogoProps } from '@/modules/design-system/types/design-system.types';

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
