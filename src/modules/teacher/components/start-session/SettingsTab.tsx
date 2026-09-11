'use client';

import { SettingsSection } from '@/modules/teacher/components/start-session/SettingsSection';
import { SETTINGS_SECTIONS } from '@/modules/teacher/constants/start-session.constants';
import type { SittingSettings } from '@/modules/teacher/schemas/teacher-session.schema';
import type { SettingToggleKey, SettingsSectionId } from '@/modules/teacher/types/start-session-modal.types';

/** The four accordions (`mTabSettings`); the switches start on the API's SittingSettings defaults. */
function SettingsTab({
  settings,
  openSections,
  onToggleSection,
  onToggleSetting,
  onTimeLimit,
}: {
  settings: SittingSettings;
  openSections: readonly SettingsSectionId[];
  onToggleSection: (id: SettingsSectionId) => void;
  onToggleSetting: (key: SettingToggleKey) => void;
  onTimeLimit: (minutes: number) => void;
}) {
  return (
    <div data-slot="start-session-settings" className="mt-5 flex flex-col gap-2.5">
      {SETTINGS_SECTIONS.map((section) => (
        <SettingsSection
          key={section.id}
          id={section.id}
          keys={section.keys}
          settings={settings}
          isOpen={openSections.includes(section.id)}
          onToggle={() => onToggleSection(section.id)}
          onToggleSetting={onToggleSetting}
          onTimeLimit={onTimeLimit}
        />
      ))}
    </div>
  );
}

export { SettingsTab };
