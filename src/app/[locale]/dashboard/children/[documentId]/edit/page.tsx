import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { EditStudentScreen } from '@/modules/children';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Children.editMeta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

interface EditChildPageProps {
  params: Promise<{ documentId: string }>;
}

// C-UI-MYCHILDREN edit route — mounts the wizard in edit mode with the detail read
// prefill (C-STUDENT-LIST-EXT). The dashboard layout guards the route once.
export default async function EditChildPage({ params }: EditChildPageProps) {
  const { documentId } = await params;
  return <EditStudentScreen documentId={documentId} />;
}
