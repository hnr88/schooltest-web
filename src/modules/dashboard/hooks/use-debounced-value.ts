'use client';

import { useEffect, useState } from 'react';

// Generic debounce for a controlled value — propagates `value` only after it
// has been stable for `delayMs`, resetting the timer on every change.
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
