/** Plain input for a generated social card; no dependency on where the copy came from. */
export interface OgCardInput {
  readonly title: string;
  readonly eyebrow: string;
  readonly locale: string;
  /** Bottom line; defaults to the localised site tagline. */
  readonly tagline?: string;
}

export interface OgCardProps {
  readonly siteName: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly tagline: string;
  readonly titleSize: number;
  readonly lang?: string;
  readonly fontFamily: string;
  readonly markSrc: string;
  readonly watermarkSrc: string;
  readonly isTracked: boolean;
  readonly isKeepAll: boolean;
}

export interface OgFont {
  readonly name: string;
  readonly data: ArrayBuffer;
  readonly weight: 400 | 700;
  readonly style: 'normal';
}

export interface OgRouteParams {
  readonly params: Promise<{ locale: string }>;
}

export interface OgArticleRouteParams {
  readonly params: Promise<{ locale: string; slug: string }>;
}

/** An `og:image` / `twitter:image` entry with every tag the platforms read. */
export interface OgImageDescriptor {
  readonly url: string;
  /** Only for https origins: an http `og:image:secure_url` is invalid. */
  readonly secureUrl?: string;
  /** Omitted for a CMS image whose dimensions are unknown, rather than guessed. */
  readonly width?: number;
  readonly height?: number;
  readonly type?: string;
  readonly alt: string;
}

export interface OgImageSet {
  readonly openGraph: OgImageDescriptor;
  readonly twitter: OgImageDescriptor;
}

/** A CMS-authored share image, used as-is instead of the generated card. */
export interface OgImageOverride {
  readonly url: string;
  readonly width?: number;
  readonly height?: number;
  readonly type?: string;
  readonly alt?: string;
}

/** What a CMS page contributes to its generated card. */
export interface OgCmsSource {
  readonly title: string;
  readonly description?: string | null;
}
