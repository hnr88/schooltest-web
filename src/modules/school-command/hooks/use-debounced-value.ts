import { useEffect, useState } from 'react';

/** Debounce the palette's raw input so each keystroke does not fire the
 * server-side student search (C-CHD-01 q param). */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
