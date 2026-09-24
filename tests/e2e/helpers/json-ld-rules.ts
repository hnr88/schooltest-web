/**
 * Structured-data checker used by json-ld.spec.ts. Validates one page's JSON-LD
 * against Google's documented required properties per type, the @id graph
 * (no dangling references) and the page's own visible content (FAQ questions,
 * HowTo steps and speakable selectors must exist on the page).
 */
type JsonObject = Record<string, unknown>;

export interface PageFacts {
  readonly locale: string;
  readonly isHome: boolean;
  readonly visibleText: string;
  readonly selectorHits: Readonly<Record<string, number>>;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function typesOfNode(node: JsonObject): string[] {
  const type = node['@type'];
  return Array.isArray(type) ? type.map(String) : type === undefined ? [] : [String(type)];
}

function walk(value: unknown, visit: (node: JsonObject, isTop: boolean) => void, isTop = false): void {
  if (Array.isArray(value)) value.forEach((item) => walk(item, visit));
  else if (isObject(value)) {
    visit(value, isTop);
    Object.values(value).forEach((child) => walk(child, visit));
  }
}

/** Every node on the page, graph-flattened, including nested typed nodes. */
export function flattenBlocks(blocks: readonly JsonObject[]): JsonObject[] {
  return blocks.flatMap((block) =>
    Array.isArray(block['@graph']) ? (block['@graph'] as JsonObject[]) : [block],
  );
}

export function danglingIds(blocks: readonly JsonObject[]): string[] {
  const refs = new Set<string>();
  const defs = new Set<string>();
  for (const node of flattenBlocks(blocks)) {
    walk(
      node,
      (child, isTop) => {
        const id = child['@id'];
        if (typeof id !== 'string') return;
        if (!isTop && Object.keys(child).length === 1) refs.add(id);
        else defs.add(id);
      },
      true,
    );
  }
  return [...refs].filter((ref) => !defs.has(ref));
}

function need(errors: string[], node: JsonObject, label: string, keys: readonly string[]): void {
  for (const key of keys) {
    const value = node[key];
    const isEmpty = value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
    if (isEmpty) errors.push(`${label} is missing required "${key}"`);
  }
}

function normalise(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function checkNode(node: JsonObject, facts: PageFacts, byId: Map<string, JsonObject>, errors: string[]): void {
  const types = typesOfNode(node);
  const label = `${types.join('+')} ${String(node['@id'] ?? '')}`.trim();
  if (types.includes('Organization')) {
    need(errors, node, label, ['name', 'url', 'logo']);
    if (isObject(node.logo) && !node.logo.url) errors.push(`${label} logo has no url`);
  }
  if (types.includes('WebSite')) need(errors, node, label, ['name', 'url', 'publisher']);
  if (types.includes('WebPage')) {
    need(errors, node, label, ['url', 'name', 'inLanguage', 'isPartOf']);
    if (node.inLanguage !== facts.locale) errors.push(`${label} inLanguage ${String(node.inLanguage)} != ${facts.locale}`);
  }
  if (types.includes('FAQPage')) {
    const entities = Array.isArray(node.mainEntity) ? node.mainEntity : [];
    if (entities.length === 0) errors.push(`${label} FAQPage has no mainEntity`);
    for (const ref of entities) {
      const question = isObject(ref) && typeof ref['@id'] === 'string' ? (byId.get(ref['@id']) ?? ref) : ref;
      if (!isObject(question) || !typesOfNode(question).includes('Question')) {
        errors.push(`${label} mainEntity is not a Question`);
        continue;
      }
      const answer = question.acceptedAnswer;
      if (!question.name || !isObject(answer) || !answer.text) errors.push(`${label} Question lacks name/acceptedAnswer.text`);
      if (!facts.visibleText.includes(normalise(String(question.name)))) {
        errors.push(`FAQ question not visible on page: ${String(question.name)}`);
      }
      if (isObject(answer) && !facts.visibleText.includes(normalise(String(answer.text)))) {
        errors.push(`FAQ answer not visible on page: ${String(answer.text).slice(0, 60)}`);
      }
    }
  }
  if (types.includes('BreadcrumbList')) {
    const items = Array.isArray(node.itemListElement) ? (node.itemListElement as JsonObject[]) : [];
    if (items.length < 2) errors.push(`${label} needs at least 2 ListItems`);
    items.forEach((item, index) => {
      if (item.position !== index + 1) errors.push(`${label} position ${String(item.position)} at index ${index}`);
      if (!item.name) errors.push(`${label} ListItem ${index + 1} has no name`);
      if (!item.item && index < items.length - 1) errors.push(`${label} ListItem ${index + 1} has no item`);
    });
  }
  if (types.includes('HowTo')) {
    need(errors, node, label, ['name', 'step']);
    const steps = Array.isArray(node.step) ? (node.step as JsonObject[]) : [];
    if (steps.length < 2) errors.push(`${label} needs at least 2 steps`);
    for (const step of steps) {
      if (!step.text) errors.push(`${label} step has no text`);
      if (step.name && !facts.visibleText.includes(normalise(String(step.name)))) {
        errors.push(`HowTo step not visible on page: ${String(step.name)}`);
      }
    }
  }
  if (types.includes('Service')) need(errors, node, label, ['name', 'provider', 'areaServed', 'audience']);
  if (types.includes('SoftwareApplication')) {
    need(errors, node, label, ['name', 'applicationCategory', 'operatingSystem']);
    for (const key of ['aggregateRating', 'review']) {
      if (node[key] !== undefined) errors.push(`${label} carries ${key} with no rating source`);
    }
  }
  if (types.some((type) => ['Article', 'BlogPosting', 'NewsArticle'].includes(type))) {
    need(errors, node, label, ['headline', 'author', 'datePublished', 'publisher']);
  }
  if (isObject(node.speakable)) {
    const selectors = Array.isArray(node.speakable.cssSelector) ? node.speakable.cssSelector : [];
    for (const selector of selectors) {
      if (!facts.selectorHits[String(selector)]) errors.push(`speakable selector matches nothing: ${String(selector)}`);
    }
  }
}

/** All violations for one page; an empty list means the page passes. */
export function checkPageJsonLd(blocks: readonly JsonObject[], facts: PageFacts): string[] {
  const errors: string[] = [];
  for (const block of blocks) {
    if (block['@context'] !== 'https://schema.org') errors.push('block @context is not https://schema.org');
  }
  const nodes = flattenBlocks(blocks);
  const byId = new Map<string, JsonObject>();
  for (const node of nodes) if (typeof node['@id'] === 'string') byId.set(node['@id'], node);
  const types = nodes.flatMap(typesOfNode);
  for (const required of ['Organization', 'WebSite', 'WebPage']) {
    if (!types.includes(required)) errors.push(`page has no ${required} node`);
  }
  if (!facts.isHome && !types.includes('BreadcrumbList')) errors.push('non-home page has no BreadcrumbList');
  for (const ref of danglingIds(blocks)) errors.push(`dangling @id reference: ${ref}`);
  for (const node of nodes) checkNode(node, facts, byId, errors);
  return errors;
}
