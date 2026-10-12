import { NextIntlClientProvider } from 'next-intl';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import enMessages from '@/i18n/messages/en.json';
import zhMessages from '@/i18n/messages/zh.json';
import { PolicyLinks } from '@/modules/auth/components/PolicyLinks';

function render(locale: string, messages: Record<string, unknown>, className?: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Australia/Sydney">
      <PolicyLinks className={className} />
    </NextIntlClientProvider>,
  );
  return host;
}

describe('PolicyLinks — the policy line where people first enter data (G-24)', () => {
  test('renders the lead and the three policy links with the right hrefs and labels', () => {
    const host = render('en', enMessages);
    const links = Array.from(host.querySelectorAll('a'));
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/privacy-policy',
      '/terms-of-service',
      '/cookie-policy',
    ]);
    expect(links.map((a) => a.textContent)).toEqual([
      'Privacy Policy',
      'Terms of Service',
      'Cookie Policy',
    ]);
    expect(host.textContent).toContain('How we handle information:');
  });

  test('opens in the same tab and carries no checkbox or acknowledgement control', () => {
    const host = render('en', enMessages);
    for (const a of Array.from(host.querySelectorAll('a'))) {
      expect(a.getAttribute('target')).toBeNull();
    }
    expect(host.querySelector('input, button')).toBeNull();
  });

  test('uses the translated Navigation labels for a non-English locale', () => {
    const host = render('zh', zhMessages);
    const labels = Array.from(host.querySelectorAll('a')).map((a) => a.textContent);
    expect(labels).toEqual([
      zhMessages.Navigation.privacyPolicy,
      zhMessages.Navigation.termsOfService,
      zhMessages.Navigation.cookiePolicy,
    ]);
  });

  test('merges a caller className onto the paragraph', () => {
    const host = render('en', enMessages, 'text-center');
    expect(host.querySelector('p[data-slot="policy-links"]')?.className).toContain('text-center');
  });
});
