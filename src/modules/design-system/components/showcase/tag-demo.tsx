'use client';

import { useState } from 'react';

import { Tag } from '@/modules/design-system/components/tag';

interface TagDemoProps {
  label: string;
  removeLabel: string;
}

function TagDemo({ label, removeLabel }: TagDemoProps) {
  const [isVisible, setIsVisible] = useState(true);
  if (!isVisible) {
    return null;
  }
  return <Tag label={label} removeLabel={removeLabel} onRemove={() => setIsVisible(false)} />;
}

export { TagDemo, type TagDemoProps };
