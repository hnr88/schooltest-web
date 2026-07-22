'use client';

import { useState } from 'react';

import { Button } from '@/modules/design-system/components/button';
import { ChoicePillGroup } from '@/modules/design-system/components/choice-pill-group';
import { FilterRail } from '@/modules/design-system/components/filter-rail';
import { FilterRailSection } from '@/modules/design-system/components/filter-rail-section';
import type { ChoiceOption } from '@/modules/design-system/types/choice.types';

interface FilterRailDemoProps {
  title: string;
  clearLabel: string;
  sectorLabel: string;
  sectorOptions: readonly ChoiceOption[];
  stageLabel: string;
  stageOptions: readonly ChoiceOption[];
  applyLabel: string;
}

function FilterRailDemo({
  title,
  clearLabel,
  sectorLabel,
  sectorOptions,
  stageLabel,
  stageOptions,
  applyLabel,
}: FilterRailDemoProps) {
  const [sectors, setSectors] = useState<readonly string[]>([sectorOptions[0]?.value ?? '']);
  const [stage, setStage] = useState(stageOptions[0]?.value ?? '');

  return (
    <FilterRail
      title={title}
      action={
        <Button variant="link" size="sm" onClick={() => setSectors([])} className="min-h-11 px-0">
          {clearLabel}
        </Button>
      }
      footer={
        <Button size="sm" className="min-h-11 w-full">
          {applyLabel}
        </Button>
      }
    >
      <FilterRailSection title={sectorLabel} collapsible>
        <ChoicePillGroup
          mode="multiple"
          size="sm"
          options={sectorOptions}
          value={sectors}
          onValueChange={setSectors}
          ariaLabel={sectorLabel}
        />
      </FilterRailSection>
      <FilterRailSection title={stageLabel} collapsible>
        <ChoicePillGroup
          size="sm"
          options={stageOptions}
          value={stage}
          onValueChange={setStage}
          ariaLabel={stageLabel}
        />
      </FilterRailSection>
    </FilterRail>
  );
}

export { FilterRailDemo, type FilterRailDemoProps };
