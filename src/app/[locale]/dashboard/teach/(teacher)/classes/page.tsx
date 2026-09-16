import { redirect } from '@/i18n/navigation';
import { RESULTS_HREF } from '@/modules/shell';

interface TeachClassesPageProps {
  params: Promise<{ locale: string }>;
}

// FLEETFIX-D12: the bare /dashboard/teach/classes segment had no route of its
// own, so a visitor hit the locale 404 wall before any guard could run — every
// sibling in the (teacher) group bounces an ANONYMOUS visitor to /sign-in via
// the TeacherGuard layout this group sits under. Registering the segment here
// puts it under that same signed-in bounce (anon: redirect to the teacher home,
// whose TeacherGuard bounces to /sign-in; signed-in teacher: the class list),
// exactly like the bare /dashboard/teach hand-over in teach/page.tsx.
export default async function TeachClassesPage({ params }: TeachClassesPageProps) {
  const { locale } = await params;
  redirect({ href: RESULTS_HREF, locale });
}
