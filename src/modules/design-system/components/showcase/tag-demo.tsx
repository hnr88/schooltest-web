'use client';

import { useState } from 'react';

import { Tag } from '@/modules/design-system/components/tag';

import type { TagDemoProps } from '@/modules/design-system/types/showcase.types';


function TagDemo({ label, removeLabel }: TagDemoProps) {
  const [isVisible, setIsVisible] = useState(true);
  if (!isVisible) {
    return null;
  }
  return <Tag label={label} removeLabel={removeLabel} onRemove={() => setIsVisible(false)} />;
}

export { TagDemo, type TagDemoProps };
