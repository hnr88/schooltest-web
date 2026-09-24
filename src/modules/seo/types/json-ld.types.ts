/**
 * Hand-written schema.org shapes for the JSON-LD this site publishes. Only the
 * properties the builders emit are typed; every node lives in one `@graph` per
 * page and points at its neighbours by `@id`.
 */
export interface JsonLdRef {
  readonly '@id': string;
}

export interface ImageObjectNode {
  readonly '@type': 'ImageObject';
  readonly '@id'?: string;
  readonly url: string;
  readonly contentUrl?: string;
  readonly width?: number;
  readonly height?: number;
  readonly caption?: string;
}

export interface ContactPointNode {
  readonly '@type': 'ContactPoint';
  readonly contactType: string;
  readonly url?: string;
  readonly email?: string;
  readonly areaServed?: string;
  readonly availableLanguage?: readonly string[];
}

export interface CountryNode {
  readonly '@type': 'Country';
  readonly name: string;
}

export interface OrganizationNode {
  readonly '@type': 'Organization';
  readonly '@id': string;
  readonly name: string;
  readonly url: string;
  readonly description: string;
  readonly logo: ImageObjectNode;
  readonly image: JsonLdRef;
  readonly areaServed: CountryNode;
  readonly sameAs?: readonly string[];
  readonly contactPoint?: readonly ContactPointNode[];
}

export interface WebSiteNode {
  readonly '@type': 'WebSite';
  readonly '@id': string;
  readonly name: string;
  readonly url: string;
  readonly description: string;
  readonly inLanguage: readonly string[];
  readonly publisher: JsonLdRef;
}

export type WebPageType = 'WebPage' | 'CollectionPage' | 'AboutPage' | 'ContactPage' | 'FAQPage';

export interface SpeakableNode {
  readonly '@type': 'SpeakableSpecification';
  readonly cssSelector: readonly string[];
}

export interface WebPageNode {
  readonly '@type': WebPageType | readonly WebPageType[];
  readonly '@id': string;
  readonly url: string;
  readonly name: string;
  readonly description: string;
  readonly inLanguage: string;
  readonly isPartOf: JsonLdRef;
  readonly publisher: JsonLdRef;
  readonly primaryImageOfPage?: ImageObjectNode;
  readonly breadcrumb?: JsonLdRef;
  readonly about?: JsonLdRef;
  readonly mainEntity?: readonly JsonLdRef[];
  readonly speakable?: SpeakableNode;
  readonly datePublished?: string;
  readonly dateModified?: string;
}

export interface ListItemNode {
  readonly '@type': 'ListItem';
  readonly position: number;
  readonly name: string;
  readonly item: string;
}

export interface BreadcrumbListNode {
  readonly '@type': 'BreadcrumbList';
  readonly '@id'?: string;
  readonly itemListElement: readonly ListItemNode[];
}

export interface AnswerNode {
  readonly '@type': 'Answer';
  readonly text: string;
}

/** One FAQ entry. The page's WebPage becomes `[WebPage, FAQPage]` and lists these as `mainEntity`. */
export interface QuestionNode {
  readonly '@type': 'Question';
  readonly '@id': string;
  readonly name: string;
  readonly inLanguage: string;
  readonly acceptedAnswer: AnswerNode;
}

export interface HowToStepNode {
  readonly '@type': 'HowToStep';
  readonly position: number;
  readonly name: string;
  readonly text: string;
  readonly url: string;
}

export interface HowToNode {
  readonly '@type': 'HowTo';
  readonly '@id': string;
  readonly name: string;
  readonly description: string;
  readonly inLanguage: string;
  readonly step: readonly HowToStepNode[];
  readonly isPartOf: JsonLdRef;
}

export interface EducationalAudienceNode {
  readonly '@type': 'EducationalAudience';
  readonly educationalRole: string;
  readonly audienceType?: string;
}

export interface ServiceNode {
  readonly '@type': 'Service';
  readonly '@id': string;
  readonly name: string;
  readonly description: string;
  readonly serviceType: string;
  readonly url: string;
  readonly provider: JsonLdRef;
  readonly areaServed: CountryNode;
  readonly audience: readonly EducationalAudienceNode[];
  readonly isRelatedTo?: JsonLdRef;
}

export interface SoftwareApplicationNode {
  readonly '@type': readonly ['SoftwareApplication', 'WebApplication'];
  readonly '@id': string;
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly applicationCategory: 'EducationalApplication';
  readonly operatingSystem: string;
  readonly browserRequirements: string;
  readonly publisher: JsonLdRef;
  readonly audience: readonly EducationalAudienceNode[];
  readonly inLanguage: readonly string[];
  readonly featureList: readonly string[];
}

export interface PersonNode {
  readonly '@type': 'Person';
  readonly name: string;
  readonly url?: string;
}

export type ArticleType = 'Article' | 'BlogPosting' | 'NewsArticle';

export interface ArticleNode {
  readonly '@type': ArticleType;
  readonly '@id': string;
  readonly headline: string;
  readonly description: string;
  readonly url: string;
  readonly image?: readonly ImageObjectNode[];
  readonly author: readonly (PersonNode | JsonLdRef)[];
  readonly publisher: JsonLdRef;
  readonly datePublished: string;
  readonly dateModified: string;
  readonly mainEntityOfPage: JsonLdRef;
  readonly isPartOf: JsonLdRef;
  readonly inLanguage: string;
  readonly wordCount?: number;
  readonly keywords?: readonly string[];
  readonly articleSection?: string;
}

export type GraphNode =
  | OrganizationNode
  | WebSiteNode
  | WebPageNode
  | BreadcrumbListNode
  | QuestionNode
  | HowToNode
  | ServiceNode
  | SoftwareApplicationNode
  | ArticleNode;

export interface JsonLdGraph {
  readonly '@context': 'https://schema.org';
  readonly '@graph': readonly GraphNode[];
}
