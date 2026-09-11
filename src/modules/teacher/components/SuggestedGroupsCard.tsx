'use client';

import { useTranslations } from 'next-intl';

import { SectionCard } from '@/modules/teacher/components/v2/SectionCard';
import type { SuggestedGroupsCardProps } from '@/modules/teacher/types/class-analytics.types';

// Teaching insights · Suggested groups (`:853–868`): the class diagnostic's own groups —
// students sharing the reading area currently holding them back — in the API's order,
// members as the API names them.
function SuggestedGroupsCard({ groups }: SuggestedGroupsCardProps) {
  const t = useTranslations('TeacherPortal.insights');
  const tv = useTranslations('TeacherPortal.viewModel');

  return (
    <SectionCard data-insights-section="groups" title={t('groups.title')} description={t('groups.description')}>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3.5">
        {groups.map((group) => (
          <li
            key={group.attribute}
            data-slot="insights-group"
            data-attribute={group.attribute}
            data-count={group.count}
            className="rounded-[10px] border border-[#ECEEF2] px-5 py-[18px]"
          >
            <div className="text-[15px] font-semibold text-navy-900">
              {group.labelKey === null ? group.attribute : tv(group.labelKey)}
            </div>
            <div className="mt-[3px] text-[12.5px] text-[#6B7280]">{t('groups.count', { count: group.count })}</div>
            <ul className="mt-3.5 flex flex-wrap gap-[7px]">
              {group.members.map((member, index) => (
                <li
                  key={`${member}-${index}`}
                  data-slot="insights-group-member"
                  className="rounded-full border border-[#ECEEF2] bg-[#F5F6F8] px-3 py-1.5 text-[12.5px] font-medium text-navy-900"
                >
                  {member}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

export { SuggestedGroupsCard };
