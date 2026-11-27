import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebounce } from './useDebounce';

export const useListSearch = (current: string, apply: (search: string) => void) => {
  const [value, setValue] = useState(current);
  const debounced = useDebounce(value.trim(), 400);
  const currentRef = useRef(current);
  const applyRef = useRef(apply);

  useEffect(() => {
    currentRef.current = current;
    applyRef.current = apply;
  }, [current, apply]);

  useEffect(() => {
    if (debounced !== currentRef.current) applyRef.current(debounced);
  }, [debounced]);

  const reset = useCallback(() => {
    setValue('');
    if (currentRef.current) applyRef.current('');
  }, []);

  return { value, setValue, reset };
};
