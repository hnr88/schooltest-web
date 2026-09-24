import { Link } from '@/i18n/navigation';
import { isExternalHref } from '@/modules/cms/lib/cms-paths';
import type { CmsFooterProps } from '@/modules/cms/types/components.types';

// Footer navigation from the CMS Layout single type. With no layout (CMS down
// or not yet published) it renders nothing rather than failing the page.
function CmsFooter({ layout }: CmsFooterProps) {
  if (!layout) return null;
  return (
    <footer data-testid="cms-footer" className="bg-navy-950 text-navy-soft">
      <div className="mx-auto flex max-w-[1200px] flex-wrap gap-12 px-8 pt-14">
        {layout.footerGroups.map((group) => (
          <nav key={group.title} aria-label={group.title} className="min-w-40">
            <h2 className="text-caption font-bold tracking-wider text-navy-muted uppercase">{group.title}</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {group.links.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  {isExternalHref(link.href) ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-body-sm hover:text-white">
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-body-sm hover:text-white"
                      {...(link.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto mt-11 max-w-[1200px] border-t border-navy-800 px-8 py-6 text-body-sm text-navy-muted">
        {layout.footerNote ? <p>{layout.footerNote}</p> : null}
        {layout.copyright ? <p className="mt-3">{layout.copyright}</p> : null}
      </div>
    </footer>
  );
}

export { CmsFooter };
