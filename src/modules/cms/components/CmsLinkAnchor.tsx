import { isExternalHref } from '@/modules/cms/lib/cms-paths';
import type { CmsLink } from '@/modules/cms/types/cms.types';

// A plain anchor: rendered inside sync, context-free section components. Site
// paths are locale-less; the locale-aware footer uses next-intl's Link instead.
function CmsLinkAnchor({ link, className }: { link: CmsLink; className?: string }) {
  const newTab = link.openInNewTab || (isExternalHref(link.href) && !link.href.startsWith('mailto:'));
  return (
    <a href={link.href} className={className} {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {link.label}
    </a>
  );
}

export { CmsLinkAnchor };
