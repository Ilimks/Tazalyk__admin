import { afterEach, describe, expect, it, vi } from 'vitest';
import { localToday } from './date';

describe('localToday — сегодняшнее число по Бишкеку', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('в 02:30 по Бишкеку это уже сегодняшнее число, а не вчерашнее по Гринвичу', () => {
    const moment = new Date('2026-11-26T20:30:00Z');

    expect(moment.toISOString().slice(0, 10)).toBe('2026-11-26');
    expect(localToday(moment)).toBe('2026-11-27');
  });

  it('без аргумента берёт текущее время и тоже считает по Бишкеку', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-26T20:30:00Z'));

    expect(localToday()).toBe('2026-11-27');
  });

  it('в 23:59 по Бишкеку число ещё не меняется, а в 00:00 — уже следующее', () => {
    expect(localToday(new Date('2026-11-27T17:59:00Z'))).toBe('2026-11-27');
    expect(localToday(new Date('2026-11-27T18:00:00Z'))).toBe('2026-11-28');
  });

  it('возвращает дату в формате ГГГГ-ММ-ДД для поля даты', () => {
    expect(localToday(new Date('2026-01-04T03:00:00Z'))).toBe('2026-01-04');
  });
});
