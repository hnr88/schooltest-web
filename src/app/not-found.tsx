import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function NotFound() {
  const t = useTranslations('Common');

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="text-sm text-muted-foreground">{t('notFound')}</p>
      <Link href="/" className="text-sm underline underline-offset-4">
        ← Home
      </Link>
    </main>
  );
}
