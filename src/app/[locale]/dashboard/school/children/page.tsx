import { redirect } from '@/i18n/navigation';

// The school roster moved from /children to /students (spec §General Notes:
// "Children" -> "Students"). API-generated notification linkUrl values still
// point at the old segment, so the path stays as a permanent redirect rather
// than a 404.
export default async function SchoolChildrenRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: '/dashboard/school/students', locale });
}
