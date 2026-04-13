import { useEffect, useLayoutEffect, useRef, type EffectCallback } from 'react';

export const useLayoutEffectOnce = (effect: EffectCallback) => {
  const wasCalledRef = useRef(false);

  useLayoutEffect(() => {
    if (wasCalledRef.current) return;

    wasCalledRef.current = true;
    return effect();
  }, []);
};

export const useEffectOnce = (effect: EffectCallback) => {
  const wasCalledRef = useRef(false);

  useEffect(() => {
    if (wasCalledRef.current) return;

    wasCalledRef.current = true;
    return effect();
  }, []);
};
