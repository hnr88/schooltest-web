import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export interface PolicyLinksProps {
  className?: string;
}

const POLICY_LINK_CLASS =
  'rounded-sm font-semibold text-primary underline-offset-2 transition-colors duration-150 hover:text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

// ST4S G-24: the privacy, terms and cookie policy links, shown where people
// first enter data (sign-up, invite accept, school onboarding). Text only:
// no checkbox and no acknowledgement gate (decisions/D5), so the entry flows
// behave exactly as before. Same-tab links; the three pages are locale-aware.
export function PolicyLinks({ className }: PolicyLinksProps) {
  const t = useTranslations('Auth');
  const tNav = useTranslations('Navigation');

  return (
    <p
      data-slot="policy-links"
      className={cn('text-body-sm text-muted-foreground', className)}
    >
      {t('policyLinks.lead')}{' '}
      <Link href="/privacy-policy" className={POLICY_LINK_CLASS}>
        {tNav('privacyPolicy')}
      </Link>
      {', '}
      <Link href="/terms-of-service" className={POLICY_LINK_CLASS}>
        {tNav('termsOfService')}
      </Link>
      {', '}
      <Link href="/cookie-policy" className={POLICY_LINK_CLASS}>
        {tNav('cookiePolicy')}
      </Link>
    </p>
  );
}
