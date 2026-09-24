import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { CmsSections } from '@/modules/cms/components/CmsSections';
import { cmsPageResponseSchema } from '@/modules/cms/schemas/cms.schema';

const page = cmsPageResponseSchema.parse(
  JSON.parse(readFileSync(resolve(process.cwd(), 'tests/unit/fixtures/cms-page.fixture.json'), 'utf8')),
).data;

function render(sections = page.sections): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = renderToStaticMarkup(<CmsSections sections={sections} />);
  return host;
}

describe('CmsSections — one component per dynamic-zone section', () => {
  const host = render();
  const section = (component: string) => host.querySelector(`[data-section="${component}"]`);

  test('renders every known section in order and skips the unknown one', () => {
    expect([...host.querySelectorAll('[data-section]')].map((el) => el.getAttribute('data-section'))).toEqual([
      'sections.key-takeaways',
      'sections.heading-text',
      'sections.faq-list',
      'sections.callout',
      'sections.contact-block',
      'sections.cta',
      'sections.media',
      'sections.rich-text',
      'unknown',
    ]);
    expect(section('unknown')?.innerHTML).toBe('');
  });

  test('heading + text: h2 with the TOC anchor, blocks as semantic HTML with marks and links', () => {
    const el = section('sections.heading-text')!;
    expect(el.querySelector('section')?.id).toBe('who');
    expect(el.querySelector('h2')?.textContent).toBe('Who this applies to');
    expect(el.querySelector('strong')?.textContent).toBe('bold');
    const link = el.querySelector('a')!;
    expect(link.getAttribute('href')).toBe('https://example.test');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(el.querySelector('ul > li')?.textContent).toBe('Item one.');
  });

  test('FAQ list renders native details/summary', () => {
    const el = section('sections.faq-list')!;
    expect(el.querySelector('summary')?.textContent).toBe('Is it free?');
    expect(el.querySelector('details p')?.textContent).toBe('TODO answer.');
  });

  test('key takeaways, callout, contact, CTA, media', () => {
    expect(section('sections.key-takeaways')!.querySelector('li')?.textContent).toBe('First takeaway.');
    const callout = section('sections.callout')!.querySelector('[role="note"]')!;
    expect(callout.getAttribute('data-tone')).toBe('warning');
    expect(callout.textContent).toContain('Content coming soon');
    const contact = section('sections.contact-block')!;
    expect(contact.querySelector('a[href="mailto:support@schooltest.com.au"]')).not.toBeNull();
    expect(contact.querySelector('a[href="tel:+61200000000"]')).not.toBeNull();
    expect(section('sections.cta')!.querySelector('a[href="/contact"]')?.textContent).toBe('Contact');
    const img = section('sections.media')!.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('http://localhost:1337/uploads/a.png');
    expect(img.getAttribute('alt')).toBe('Alt text');
    expect(section('sections.media')!.querySelector('figcaption')?.textContent).toBe('A caption');
  });

  test('rich text: a body heading is h3 under the section h2; unknown blocks render nothing', () => {
    const el = section('sections.rich-text')!;
    expect(el.querySelector('h3')?.textContent).toBe('Sub heading');
    expect(el.querySelectorAll('h3')).toHaveLength(1);
  });

  test('never injects HTML from the CMS', () => {
    const [heading] = page.sections.filter((s) => s.__component === 'sections.heading-text');
    const evil = { ...heading, body: [{ type: 'paragraph' as const, children: [{ type: 'text' as const, text: '<img src=x onerror=alert(1)>' }] }] };
    const out = render([evil]);
    expect(out.querySelector('img')).toBeNull();
    expect(out.textContent).toContain('<img src=x onerror=alert(1)>');
  });
});
