import { create } from 'zustand';
import type { Complaint, Order, VacancyApplication } from '@/types';

// запись, которую нужно открыть сразу после перехода в раздел (с «Обзора»)
type Pending =
  | { section: 'complaints'; record: Complaint }
  | { section: 'orders'; record: Order }
  | { section: 'applications'; record: VacancyApplication };

interface OpenRecordState {
  pending: Pending | null;
  set: (pending: Pending) => void;
  // забрать запись своего раздела; второй раз она уже не откроется
  take: <S extends Pending['section']>(section: S) => Extract<Pending, { section: S }>['record'] | null;
}

export const useOpenRecordStore = create<OpenRecordState>()((set, get) => ({
  pending: null,
  set: (pending) => set({ pending }),
  take: (section) => {
    const { pending } = get();
    if (pending?.section !== section) return null;
    set({ pending: null });
    return pending.record as never;
  },
}));
