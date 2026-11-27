import type { StoreApi } from 'zustand';
import { useAuthStore } from './slices/auth.slice';
import { useVideosStore } from './slices/videos.slice';
import { usePhotosStore } from './slices/photos.slice';
import { useNewsStore } from './slices/news.slice';
import { useProcurementsStore } from './slices/procurements.slice';
import { useLocalActsStore } from './slices/localActs.slice';
import { useLegislationStore } from './slices/legislation.slice';
import { useProductsStore } from './slices/products.slice';
import { useOrdersStore } from './slices/orders.slice';
import { useVacanciesStore } from './slices/vacancies.slice';
import { useApplicationsStore } from './slices/applications.slice';
import { useComplaintsStore } from './slices/complaints.slice';

export {
  useAuthStore,
  useVideosStore,
  usePhotosStore,
  useNewsStore,
  useProcurementsStore,
  useLocalActsStore,
  useLegislationStore,
  useProductsStore,
  useOrdersStore,
  useVacanciesStore,
  useApplicationsStore,
  useComplaintsStore,
};

function resettable<T>(store: StoreApi<T>) {
  const initial = store.getState();
  return () => store.setState(initial, true);
}

const resets = [
  resettable(useVideosStore),
  resettable(usePhotosStore),
  resettable(useNewsStore),
  resettable(useProcurementsStore),
  resettable(useLocalActsStore),
  resettable(useLegislationStore),
  resettable(useProductsStore),
  resettable(useOrdersStore),
  resettable(useVacanciesStore),
  resettable(useApplicationsStore),
  resettable(useComplaintsStore),
];

export const clearSessionData = () => resets.forEach((reset) => reset());

export const signOut = () => {
  useAuthStore.getState().logout();
  clearSessionData();
};
