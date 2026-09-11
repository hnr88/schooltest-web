'use client';

import { useTranslations } from 'next-intl';

import { ComingSoonPanel } from '@/modules/teacher/components/ComingSoonPanel';

// The Exit predictions tab (`Teacher Portal v2.dc.html:1004–1020`): the design's
// own placeholder — a section header, then the shared coming-soon body at the
// 44/24/30 padding. Inert on purpose: no control, no query, and no predicted
// number, because none has been measured.
function ExitPredictionsPanel() {
  const t = useTranslations('TeacherPortal.classDetail.exit');

  return (
    <section
      data-slot="exit-predictions-panel"
      aria-labelledby="exit-predictions-heading"
      className="flex flex-col gap-[18px]"
    >
      <div>
        <h2 id="exit-predictions-heading" className="text-[20px] leading-[normal] font-semibold text-navy-900">
          {t('title')}
        </h2>
        <p className="mt-1.5 text-[13.5px] leading-[normal] text-[#6B7280]">{t('subtitle')}</p>
      </div>
      <ComingSoonPanel title={t('heading')} description={t('body')} className="pb-[30px]" />
    </section>
  );
}

export { ExitPredictionsPanel };
