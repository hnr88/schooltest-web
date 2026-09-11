import { redirect } from '@/i18n/navigation';
import { RESULTS_HREF } from '@/modules/shell';

interface TeachPageProps {
  params: Promise<{ locale: string }>;
}

// The bare /dashboard/teach segment has no screen of its own: the teacher home is
// the classes list. The API's class_teacher_assigned notification
// (event-registry.ts linkUrl) and the older teach screens' back links still point
// here, so it hands over to /dashboard/results instead of falling through to the
// 404. Its children (/notifications, /settings and the (teacher) group) are
// separate routes and stay as they are. A non-teacher is bounced on by
// TeacherGuard on the results page.
export default async function TeachPage({ params }: TeachPageProps) {
  const { locale } = await params;
  redirect({ href: RESULTS_HREF, locale });
}
