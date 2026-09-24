import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { CmsFooter } from '@/modules/cms/components/CmsFooter';
import type { CmsLayout } from '@/modules/cms/types/cms.types';

function render(layout: CmsLayout | null): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = renderToStaticMarkup(<CmsFooter layout={layout} />);
  return host;
}

describe('CmsFooter — the public footer on every marketing page', () => {
  test('renders the CMS layout groups when a layout is published', () => {
    const host = render({
      footerGroups: [{ title: 'Legal', links: [{ label: 'Privacy Policy', href: '/privacy-policy' }] }],
      footerNote: 'Acknowledgement',
      copyright: '© 2026 SchoolTest',
    } as unknown as CmsLayout);
    expect(host.querySelector('footer[data-testid="cms-footer"]')).not.toBeNull();
    expect(host.querySelector('a[href="/privacy-policy"]')?.textContent).toBe('Privacy Policy');
    expect(host.querySelector('footer[data-screen-label="Footer"]')).toBeNull();
  });

  test('falls back to the static design footer when the CMS has no layout (down or unpublished)', () => {
    const host = render(null);
    expect(host.querySelector('footer[data-testid="cms-footer"]')).toBeNull();
    const fallback = host.querySelector('footer[data-screen-label="Footer"]');
    expect(fallback).not.toBeNull();
    expect(fallback?.textContent).toContain('Traditional Custodians');
    expect(fallback?.querySelector('a[href="/diagnose"]')).not.toBeNull();
  });
});
