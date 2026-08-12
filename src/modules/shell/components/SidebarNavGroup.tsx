'use client';

import { useTranslations } from 'next-intl';

import { SidebarMenu } from '@/modules/design-system';
import { RailSectionLabel } from '@/modules/shell/components/RailSectionLabel';
import { SidebarNavItem } from '@/modules/shell/components/SidebarNavItem';
import { isNavItemActive } from '@/modules/shell/lib/nav-active';
import type { NavSection } from '@/modules/shell/types/shell.types';

interface SidebarNavGroupProps {
  section: NavSection;
  pathname: string;
  onNavigate: () => void;
}

// One rail section: the group overline plus its menu. buildNavSections has already
// dropped empty groups, so this component never renders a heading over nothing.
function SidebarNavGroup({ section, pathname, onNavigate }: SidebarNavGroupProps) {
  const t = useTranslations('Shell');

  return (
    <div data-slot="nav-group" data-nav-group={section.group} className="flex flex-col">
      <RailSectionLabel>{t(`sidebar.groups.${section.labelKey}`)}</RailSectionLabel>
      <SidebarMenu className="gap-0.5">
        {section.items.map((item) => (
          <SidebarNavItem
            key={item.href}
            item={item}
            label={t(`nav.${item.labelKey}`)}
            isActive={isNavItemActive(pathname, item)}
            onNavigate={onNavigate}
          />
        ))}
      </SidebarMenu>
    </div>
  );
}

export { SidebarNavGroup };
