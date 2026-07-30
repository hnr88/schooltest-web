import { redirect } from '@/i18n/navigation';

interface OpsPageProps {
  params: Promise<{ locale: string }>;
}

// Ops console index (task 66, st-mvp-pivot): the schools list is the landing
// surface, so /dashboard/ops hands straight over to it.
export default async function OpsPage({ params }: OpsPageProps) {
  const { locale } = await params;
  redirect({ href: '/dashboard/ops/schools', locale });
}
