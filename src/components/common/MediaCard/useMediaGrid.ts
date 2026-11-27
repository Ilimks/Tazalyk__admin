import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

const MIN_CARD_WIDTH = 220;
const GAP = 20;
const MIN_COLUMNS = 2;
const MIN_ITEMS = 8;
const RESIZE_DELAY = 250;

function columnsFor(width: number) {
  return Math.max(MIN_COLUMNS, Math.floor((width + GAP) / (MIN_CARD_WIDTH + GAP)));
}

export function useMediaGrid<T extends HTMLElement>(
  load: (page: number, pageSize: number) => void,
  position: { currentPage: number; pageSize: number },
) {
  const [columns, setColumns] = useState<number | null>(null);
  const observer = useRef<ResizeObserver | null>(null);

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
