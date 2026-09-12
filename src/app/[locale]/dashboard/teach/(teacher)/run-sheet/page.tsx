import { redirect } from '@/i18n/navigation';
import { TEST_SESSIONS_PATH } from '@/modules/teacher';

interface RunSheetPageProps {
  params: Promise<{ locale: string }>;
}

// RETIRED (Teacher Portal v2, R1 PART B). The printable test-day run sheet
// (task 65) belonged to the old console; the design has no run sheet, and the
// sitting is run from the class Live sessions tab. The route hands over to the
// Live sessions page, which is where a teacher goes to run one now.
export default async function RunSheetPage({ params }: RunSheetPageProps) {
  const { locale } = await params;
  redirect({ href: TEST_SESSIONS_PATH, locale });
}
