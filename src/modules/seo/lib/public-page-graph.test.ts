import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { buildServiceJsonLd, buildSoftwareApplicationJsonLd } from '@/modules/seo/lib/json-ld-content';
import { buildPublicPageGraph } from '@/modules/seo/lib/public-page-graph';
import { serializeJsonLd } from '@/modules/seo/lib/serialize-json-ld';
import type { JsonLdGraph } from '@/modules/seo/types/json-ld.types';

const SITE = { siteName: 'SchoolTest', description: 'Diagnostic English assessment.' };
const ROOT = 'http://localhost:3000/';

function collectRefs(value: unknown, refs: Set<string>, defs: Set<string>, isTop: boolean): void {
  if (Array.isArray(value)) {
    value.forEach((item) => collectRefs(item, refs, defs, false));
    return;
  }
  if (!value || typeof value !== 'object') return;
  const record = value as Record<string, unknown>;
  const id = record['@id'];
  if (typeof id === 'string') {
    if (Object.keys(record).length === 1 && !isTop) refs.add(id);
    else defs.add(id);
  }
  Object.values(record).forEach((child) => collectRefs(child, refs, defs, false));
}

function danglingRefs(graph: JsonLdGraph): string[] {
  const refs = new Set<string>();
  const defs = new Set<string>();
  graph['@graph'].forEach((node) => collectRefs(node, refs, defs, true));
  return [...refs].filter((ref) => !defs.has(ref));
}

describe('buildPublicPageGraph', () => {
  it('home: one @graph with Organization, WebSite, the page and its FAQ — no breadcrumb', () => {
    const software = buildSoftwareApplicationJsonLd({ ...SITE, featureList: ['x'] });
    const graph = buildPublicPageGraph({
      site: SITE,
      page: { pathname: '/', locale: 'en', title: 'Home', description: 'Home page.' },
      breadcrumb: [{ name: 'Home', url: ROOT }],
      faq: [{ key: 'what', question: 'What is SchoolTest?', answer: 'An assessment.' }],
      nodes: [software],
      aboutId: software['@id'],
    });
    const types = graph['@graph'].map((node) => node['@type']);
    expect(graph['@context']).toBe('https://schema.org');
    expect(types).toContainEqual('Organization');
    expect(types).toContainEqual('WebSite');
    expect(types).toContainEqual(['WebPage', 'FAQPage']);
    expect(types).not.toContainEqual('BreadcrumbList');
    expect(danglingRefs(graph)).toEqual([]);
  });

  it('product page: BreadcrumbList + Service, every @id reference resolves inside the graph', () => {
    const service = buildServiceJsonLd({
      pathname: '/teach',
      locale: 'zh',
      name: 'Teach',
      description: 'Plan.',
      serviceType: 'Planning',
    });
    const graph = buildPublicPageGraph({
      site: SITE,
      page: { pathname: '/teach', locale: 'zh', title: 'Teach', description: 'Plan.' },
      breadcrumb: [
        { name: 'Home', url: `${ROOT}zh` },
        { name: 'Teach', url: `${ROOT}zh/teach` },
      ],
      faq: [{ key: 'names', question: 'Names?', answer: 'No.' }],
      nodes: [service, buildSoftwareApplicationJsonLd({ ...SITE, featureList: [] })],
      aboutId: service['@id'],
    });
    const breadcrumb = graph['@graph'].find((node) => node['@type'] === 'BreadcrumbList');
    expect(breadcrumb?.['@id']).toBe(`${ROOT}zh/teach#breadcrumb`);
    expect(danglingRefs(graph)).toEqual([]);
  });

  it('detects a dangling reference (checker sanity)', () => {
    const graph = buildPublicPageGraph({
      site: SITE,
      page: { pathname: '/track', locale: 'en', title: 'Track', description: 'Progress.' },
    });
    expect(danglingRefs(graph)).toEqual([`${ROOT}track#breadcrumb`]);
  });
});

describe('serializeJsonLd', () => {
  it('cannot be broken out of by a </script> or <!-- inside a value, and round-trips', () => {
    const data = { name: '</script><script>alert(1)</script> <!-- & \u2028\u2029' };
    const out = serializeJsonLd(data);
    expect(out).not.toMatch(/[<>&\u2028\u2029]/);
    expect(out).toContain('\\u003c/script\\u003e');
    expect(JSON.parse(out)).toEqual(data);
  });

  it('source files contain no raw U+2028/U+2029 (they break the compiled chunk)', () => {
    for (const file of ['./serialize-json-ld.ts', './json-ld.ts', './json-ld-content.ts', './json-ld-article.ts']) {
      const source = readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8');
      expect(/[\u2028\u2029]/.test(source), file).toBe(false);
    }
  });
});
