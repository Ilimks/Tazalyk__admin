import { useEffect, useRef } from 'react';

// открытые окна снизу вверх: Esc и Tab относятся только к верхнему
const openDialogs: symbol[] = [];

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Клавиатура в окне: при открытии фокус уходит внутрь, Tab ходит по кругу, Esc закрывает,
 * после закрытия фокус возвращается туда, откуда окно открыли.
 * Без этого Tab попадал на таблицу под окном, и можно было нажать «Удалить» у записи, которой не видно.
 */
export const useDialog = <T extends HTMLElement>(isOpen: boolean, onClose: () => void) => {
  const ref = useRef<T>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const box = ref.current;
    if (!isOpen || !box) return;

    const id = Symbol('dialog');
    openDialogs.push(id);
    const opener = document.activeElement as HTMLElement | null;

    if (!box.contains(opener)) {
      const first = box.querySelector<HTMLElement>('[data-dialog-first] button:not([disabled])');
      (first ?? box).focus({ preventScroll: true });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (openDialogs[openDialogs.length - 1] !== id) return;
      if (e.key === 'Escape') {
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab') return;

      const items = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((item) => item.offsetParent !== null);
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!first) {
        e.preventDefault();
      } else if (e.shiftKey && (active === first || active === box || !box.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !box.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      openDialogs.splice(openDialogs.indexOf(id), 1);
      // запись могла быть удалена вместе со своей кнопкой
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [isOpen]);

  return ref;
};
