import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { InviteAcceptScreen } from '@/modules/invitation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Invite.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

// Guest invitation accept page (task 23, contracts C-INV-05/06). The token
// comes from the school admin's invitation email; no account is required.
export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  return <InviteAcceptScreen token={token} />;
}
