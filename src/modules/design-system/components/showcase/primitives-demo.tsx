'use client';

import { useState } from 'react';

import { ToggleRow } from '@/modules/design-system/components/toggle-row';
import { UnderlineTabs } from '@/modules/design-system/components/underline-tabs';
import type { UnderlineTabOption } from '@/modules/design-system/types/primitives.types';

interface PrimitivesDemoProps {
  tabs: readonly UnderlineTabOption[];
  tabsAriaLabel: string;
  resultsLabel: string;
  resultsHint: string;
  shuffleLabel: string;
  shuffleHint: string;
}

function PrimitivesDemo({
  tabs,
  tabsAriaLabel,
  resultsLabel,
  resultsHint,
  shuffleLabel,
  shuffleHint,
}: PrimitivesDemoProps) {
  const [tab, setTab] = useState(tabs[0]?.value ?? '');
  const [results, setResults] = useState(true);
  const [shuffle, setShuffle] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <UnderlineTabs options={tabs} value={tab} onValueChange={setTab} ariaLabel={tabsAriaLabel} />
      <div className="flex flex-col rounded-panel border border-border bg-card px-6 py-2">
        <ToggleRow
          label={resultsLabel}
          description={resultsHint}
          checked={results}
          onCheckedChange={setResults}
        />
        <ToggleRow
          label={shuffleLabel}
          description={shuffleHint}
          checked={shuffle}
          onCheckedChange={setShuffle}
        />
      </div>
    </div>
  );
}

export { PrimitivesDemo, type PrimitivesDemoProps };
