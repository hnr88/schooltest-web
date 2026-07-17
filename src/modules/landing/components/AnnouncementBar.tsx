import { getTranslations } from 'next-intl/server';

async function AnnouncementBar() {
  const t = await getTranslations('Home');

  return (
    <div className="bg-navy-900 px-6 py-2.5 text-sm text-white">
      <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span>{t('announcement.message')}</span>
        <a href="#ai-feedback" className="font-semibold underline-offset-4 hover:underline">
          {t('announcement.link')}
        </a>
      </p>
    </div>
  );
}

export { AnnouncementBar };
