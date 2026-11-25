import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebounce } from './useDebounce';

/**
 * Строка поиска над списком: запрос уходит, когда сотрудник перестал печатать.
 * Сам поиск хранит стор раздела — при листании страниц и удалении записи он не сбрасывается.
 */
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

  // без ожидания: «Сбросить» должно сработать сразу
  const reset = useCallback(() => {
    setValue('');
    if (currentRef.current) applyRef.current('');
  }, []);

  return { value, setValue, reset };
};
