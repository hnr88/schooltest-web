/* eslint-disable @next/next/no-img-element */
import type { ReactElement } from 'react';

import { OG_ACCENT, OG_BACKGROUND, OG_FOREGROUND } from '@/modules/seo/constants/seo.constants';
import { OG_MUTED } from '@/modules/seo/constants/og.constants';

import type { OgCardProps } from '@/modules/seo/types/og.types';

// The 1200x630 social card body, rendered only by next/og's ImageResponse.
// Satori supports a flexbox subset of CSS and no Tailwind classes, so the
// brand ink is inlined from the seo constants; this never mounts in a browser.
function OgCard({
  siteName,
  eyebrow,
  title,
  tagline,
  titleSize,
  lang,
  fontFamily,
  markSrc,
  watermarkSrc,
  isTracked,
  isKeepAll,
}: OgCardProps): ReactElement {
  return (
    <div
      lang={lang}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: OG_BACKGROUND,
        color: OG_FOREGROUND,
        padding: '64px 72px',
        fontFamily,
        wordBreak: isKeepAll ? 'keep-all' : 'normal',
        overflow: 'hidden',
      }}
    >
      <img
        src={watermarkSrc}
        alt=""
        width={640}
        height={640}
        style={{ position: 'absolute', right: -150, bottom: -170, opacity: 0.07 }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <img src={markSrc} alt="" width={72} height={72} />
        <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.01em' }}>{siteName}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 6, borderRadius: 3, background: OG_ACCENT }} />
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: OG_ACCENT,
              letterSpacing: isTracked ? '0.08em' : 0,
              textTransform: isTracked ? 'uppercase' : 'none',
            }}
          >
            {eyebrow}
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: titleSize, fontWeight: 700, lineHeight: 1.12, letterSpacing: '-0.02em' }}>
          {title}
        </div>
      </div>
      <div style={{ display: 'flex', fontSize: 26, fontWeight: 400, color: OG_MUTED, lineHeight: 1.4, maxWidth: 940 }}>
        {tagline}
      </div>
    </div>
  );
}

export { OgCard };
