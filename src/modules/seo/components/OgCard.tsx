import type { ReactElement } from 'react';

import { OG_ACCENT, OG_BACKGROUND, OG_FOREGROUND } from '@/modules/seo/constants/seo.constants';

interface OgCardProps {
  readonly siteName: string;
  readonly title: string;
  readonly tagline: string;
}

// The Open Graph / Twitter card body, rendered by next/og's ImageResponse.
// Satori supports only a flexbox subset of CSS and no Tailwind classes, so the
// brand tokens are inlined here from the seo constants rather than from the
// theme — this element is never mounted in the browser.
function OgCard({ siteName, title, tagline }: OgCardProps): ReactElement {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: OG_BACKGROUND,
        color: OG_FOREGROUND,
        padding: '72px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: 16, height: 16, borderRadius: 16, background: OG_ACCENT }} />
        <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '0.04em' }}>{siteName}</div>
      </div>
      <div style={{ display: 'flex', fontSize: 66, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
      <div style={{ display: 'flex', fontSize: 28, color: '#B9C6DF', lineHeight: 1.35 }}>
        {tagline}
      </div>
    </div>
  );
}

export { OgCard };
