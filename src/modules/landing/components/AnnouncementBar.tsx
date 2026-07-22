import { getTranslations } from 'next-intl/server';

async function AnnouncementBar() {
  const t = await getTranslations('Home');

  return (
    <div data-slot="announcement-bar" className="bg-navy-900 px-6 py-2.5 text-caption text-navy-body">
      <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span>{t('announcement.message')}</span>
        <a
          href="#ai-feedback"
          className="rounded-sm font-semibold text-accent-on-dark-hover underline-offset-4 transition-colors duration-150 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-on-dark"
        >
          {t('announcement.link')}
        </a>
      </p>
    </div>
  );
}

export { AnnouncementBar };
