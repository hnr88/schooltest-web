import { redirect } from '@/i18n/navigation';
import { classResultsHref } from '@/modules/teacher';

interface TeachDiagnosticPageProps {
  params: Promise<{ locale: string; classId: string }>;
}

// RETIRED (Teacher Portal v2, R1 PART B). The C-RPT-01/02 diagnostic dashboard
// this route rendered (tasks 75-77) is the class detail's Teaching insights and
// Class progress tabs now. Its C-RPT-03 "Export for AI" button went with it:
// `export.md` carries every roster first name + initial (TB-22), and the class
// AI export is B7's de-identified `/export/insights` inside the Reports modal.
// `DiagnosticDashboard` / `ProgressPanel` themselves stay — the school-admin
// analytics screen still mounts both.
export default async function TeachDiagnosticPage({ params }: TeachDiagnosticPageProps) {
  const { locale, classId } = await params;
  redirect({ href: `${classResultsHref(classId)}?tab=insights`, locale });
}
