'use client';

import { useState } from 'react';

import { SegmentedControl } from '@/modules/design-system/components/segmented-control';
import type { SegmentedControlOption } from '@/modules/design-system/types/design-system.types';

interface SegmentedDemoProps {
  options: SegmentedControlOption[];
  initialValue: string;
  ariaLabel: string;
}

function SegmentedDemo({ options, initialValue, ariaLabel }: SegmentedDemoProps) {
  const [value, setValue] = useState(initialValue);
  return (
    <SegmentedControl
      options={options}
      value={value}
      onValueChange={setValue}
      ariaLabel={ariaLabel}
    />
  );
}

export { SegmentedDemo, type SegmentedDemoProps };
