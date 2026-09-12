import { redirect } from '@/i18n/navigation';
import { classResultsHref } from '@/modules/teacher';

interface TestDayPageProps {
  params: Promise<{ locale: string; documentId: string }>;
}

// RETIRED (Teacher Portal v2, R1 PART B). The test-day console (task 64,
// `test-day/TestDayScreen`) is the class detail's Live sessions tab now
// (`teacher/components/live/*`, chunks S7a/S7b): the same sitting, the same
// room and per-student controls, on the design's layout. Kept as a redirect
// so the links the old screens printed still land somewhere real.
export default async function TestDayPage({ params }: TestDayPageProps) {
  const { locale, documentId } = await params;
  redirect({ href: `${classResultsHref(documentId)}?tab=live`, locale });
}
