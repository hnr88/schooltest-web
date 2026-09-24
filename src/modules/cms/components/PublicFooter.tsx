import { CmsFooter } from '@/modules/cms/components/CmsFooter';
import { getCmsLayout } from '@/modules/cms/lib/cms-queries';

// The public footer for every marketing page: the CMS Layout footer for the
// locale (en fallback), or the static footer when the CMS is unreachable.
async function PublicFooter({ locale }: { locale: string }) {
  return <CmsFooter layout={await getCmsLayout(locale)} />;
}

export { PublicFooter };
