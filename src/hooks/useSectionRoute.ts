import { useCallback, useEffect, useState } from 'react';
import { pathOf, tabOf } from '@/layout/routes';
import type { ActiveTab } from '@/types';

/** Открытый раздел хранится в адресе страницы. */
export const useSectionRoute = () => {
  const [tab, setTab] = useState<ActiveTab>(() => tabOf(window.location.pathname) ?? 'dashboard');

  useEffect(() => {
    // кнопки браузера «Назад» и «Вперёд»
    const handlePop = () => setTab(tabOf(window.location.pathname) ?? 'dashboard');
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const go = useCallback((next: ActiveTab) => {
    if (window.location.pathname !== pathOf(next)) window.history.pushState(null, '', pathOf(next));
    setTab(next);
  }, []);

  // адрес чужого или несуществующего раздела заменяется тем, что на самом деле открыто
  const fix = useCallback((actual: ActiveTab) => {
    if (window.location.pathname !== pathOf(actual)) window.history.replaceState(null, '', pathOf(actual));
  }, []);

  return { tab, go, fix };
};
