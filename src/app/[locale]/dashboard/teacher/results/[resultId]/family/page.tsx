import { notFound } from 'next/navigation';

import { TeacherGuard } from '@/modules/auth';
import { FamilyPreviewWired } from '@/modules/report/components/FamilyPreviewWired';
import { parentViewsEnabled } from '@/modules/flags/lib/flags';

interface FamilyPreviewPageProps {
  params: Promise<{ resultId: string }>;
}

// Task 35's route (`/en/dashboard/teacher/results/:id/family`): the ALLOW-LIST
// family preview over one result. The surface is env-gated exactly as the MVP
// hides parent-facing views: flag off renders notFound — the route stays
// hidden, never an empty shell claiming to exist. Flag on, the page mounts the
// report module's wired preview, whose view model is the only place a field
// decides whether the family surface shows it (no posterior, ever).
export default async function FamilyPreviewPage({ params }: FamilyPreviewPageProps) {
  if (!parentViewsEnabled()) notFound();
  const { resultId } = await params;

  return (
    <TeacherGuard>
      <FamilyPreviewWired resultId={resultId} />
    </TeacherGuard>
  );
}
