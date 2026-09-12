import { redirect } from '@/i18n/navigation';
import { classResultsHref } from '@/modules/teacher';

interface TeachRosterPageProps {
  params: Promise<{ locale: string; documentId: string }>;
}

// RETIRED (Teacher Portal v2, R1 PART B). The read-only class roster this route
// rendered (task 63, `teach/RosterScreen`) is the class detail's Students tab
// now — same class, same roster read, the design's table. The route is kept as a
// redirect, not deleted, because the class_teacher_assigned notification and old
// bookmarks still address it; the class documentId is the same id the v2 detail
// takes, so it carries straight over.
export default async function TeachRosterPage({ params }: TeachRosterPageProps) {
  const { locale, documentId } = await params;
  redirect({ href: classResultsHref(documentId), locale });
}
