import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

/** Карточка не уже этого, иначе превью и кнопки не помещаются. */
const MIN_CARD_WIDTH = 220;
const GAP = 20;
/** Меньше двух колонок не бывает даже на телефоне — так было и в стилях сетки. */
const MIN_COLUMNS = 2;
/** Сколько карточек как минимум показывать на странице. */
const MIN_ITEMS = 8;
/** Пока окно тянут мышью, ширина меняется много раз — грузим, когда она успокоится. */
const RESIZE_DELAY = 250;

function columnsFor(width: number) {
  return Math.max(MIN_COLUMNS, Math.floor((width + GAP) / (MIN_CARD_WIDTH + GAP)));
}

/**
 * Сетка карточек фото и видео, в которой страница заканчивается полным рядом.
 *
 * Раньше на страницу всегда приходило 8 карточек, а колонок было столько, сколько
 * поместится по ширине: при пяти колонках второй ряд оставался с двумя пустыми
 * местами, хотя дальше была ещё страница. Теперь колонки считаются здесь,
 * сетка строится ровно из них, а размер страницы кратен их числу:
 * 5 колонок — 10 карточек, 4 — 8, 3 — 9, 2 — 8.
 *
 * `ref` вешается на блок раздела, а не на саму сетку: её нет, пока идёт загрузка
 * или раздел пуст. Первая страница грузится, как только известна ширина;
 * при смене ширины страница пересчитывается так, чтобы первая карточка
 * осталась на экране.
 */
export function useMediaGrid<T extends HTMLElement>(
  load: (page: number, pageSize: number) => void,
  position: { currentPage: number; pageSize: number },
) {
  const [columns, setColumns] = useState<number | null>(null);
  const observer = useRef<ResizeObserver | null>(null);

  // ref-функция: блок раздела пересоздаётся (между ним и загрузкой React
  // переключает разметку), и следить нужно за тем, что сейчас на экране
  const ref = useCallback((element: T | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!element) return;
    const measure = () => {
      if (element.clientWidth > 0) setColumns(columnsFor(element.clientWidth));
    };
    measure();
    observer.current = new ResizeObserver(measure);
    observer.current.observe(element);
  }, []);

  const pageSize = columns ? columns * Math.max(2, Math.ceil(MIN_ITEMS / columns)) : null;

  const latest = useRef({ load, position });
  useLayoutEffect(() => {
    latest.current = { load, position };
  });

  const loaded = useRef(false);
  useEffect(() => {
    if (!pageSize) return;
    if (!loaded.current) {
      loaded.current = true;
      latest.current.load(1, pageSize);
      return;
    }
    const timer = window.setTimeout(() => {
      const { currentPage, pageSize: shown } = latest.current.position;
      if (shown === pageSize) return;
      const firstShown = (currentPage - 1) * shown;
      latest.current.load(Math.floor(firstShown / pageSize) + 1, pageSize);
    }, RESIZE_DELAY);
    return () => window.clearTimeout(timer);
  }, [pageSize]);

  const gridStyle: CSSProperties | undefined = columns
    ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
    : undefined;

  return { ref, gridStyle };
}
