import { LandingHeader } from '@/modules/landing';
import { getCmsLayout } from '@/modules/cms/lib/cms-queries';
import { CmsFooter } from '@/modules/cms/components/CmsFooter';
import { PublicSiteBanner, getPublicSettings } from '@/modules/settings';

// Public chrome for CMS pages: ops banner, masthead, CMS footer. Each source
// degrades on its own — a settings or CMS outage drops that strip, never the page.
async function CmsPublicShell({ locale, children }: { locale: string; children: React.ReactNode }) {
  const [settings, layout] = await Promise.all([
    getPublicSettings().catch(() => null),
    getCmsLayout(locale),
  ]);
  return (
    <div className="min-h-screen bg-background text-foreground">
      {settings ? <PublicSiteBanner settings={settings} /> : null}
      <LandingHeader />
      {children}
      <CmsFooter layout={layout} />
    </div>
  );
}

export { CmsPublicShell };
