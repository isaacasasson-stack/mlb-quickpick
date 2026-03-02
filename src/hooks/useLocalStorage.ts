import { useState, useCallback } from 'react';

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setAndPersist = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue(prev => {
        const next =
          typeof newValue === 'function'
            ? (newValue as (p: T) => T)(prev)
            : newValue;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // storage full or private mode — ignore
        }
        return next;
      });
    },
    [key]
  );

  return [value, setAndPersist] as const;
}
