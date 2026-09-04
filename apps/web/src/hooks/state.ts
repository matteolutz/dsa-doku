import { useEffect, useRef, useState, useCallback } from 'react';

export const useDebouncedState = <T>(
  initialValue: T | (() => T),
  options: { debounceTime: number }
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(initialValue);
  const stateRef = useRef(state);

  const pendingRef = useRef<{ value: T } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const setStateDebounced: React.Dispatch<React.SetStateAction<T>> =
    useCallback(
      (newValue) => {
        const currentValue = pendingRef.current
          ? pendingRef.current.value
          : stateRef.current;

        const value =
          typeof newValue === 'function'
            ? (newValue as (prev: T) => T)(currentValue)
            : newValue;

        pendingRef.current = { value };

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setState(value);
          pendingRef.current = null;
          timeoutRef.current = null;
        }, options.debounceTime);
      },
      [options.debounceTime]
    );

  return [state, setStateDebounced];
};
