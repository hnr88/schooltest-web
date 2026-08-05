import { redirect } from '@/i18n/navigation';

// Legacy add-student path — see the sibling page for why the redirect stays.
export default async function SchoolNewChildRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: '/dashboard/school/students/new', locale });
}
