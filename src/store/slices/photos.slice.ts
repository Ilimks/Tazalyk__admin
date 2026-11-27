import { create } from 'zustand';
import { isMissingPage, toLoadError, toSaveError } from '@/utils/apiErrors';
import { devtools } from 'zustand/middleware';
import { photosService } from '@/api/services/photos.service';
import type { Photo, SaveResult } from '@/types';

interface PhotosState {
  photos: Photo[];
  loading: boolean;
  loadError: string | null;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  fetchPage: (page?: number, pageSize?: number) => Promise<void>;
  addPhoto: (photo: Omit<Photo, 'id' | 'created_at'>) => Promise<SaveResult<Photo>>;
  updatePhoto: (id: string, photo: Partial<Photo>) => Promise<SaveResult<Photo>>;
  deletePhoto: (id: string) => Promise<boolean>;
  goToPage: (page: number) => void;
  changePageSize: (size: number) => void;
}

export const usePhotosStore = create<PhotosState>()(
  devtools((set, get) => ({
    photos: [],
    loading: false,
    loadError: null,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 8,

    fetchPage: async (page = 1, pageSize = 8) => {
      set({ loading: true, error: null, loadError: null });
      try {
        const response = await photosService.getPage(page, pageSize);
        set({ 
          photos: response.results,
          totalCount: response.count,
          currentPage: page,
          pageSize: pageSize,
          loading: false 
        });
      } catch (error) {
        if (isMissingPage(error) && page > 1) {
          get().fetchPage(page - 1, pageSize);
          return;
        }
        console.error('Failed to fetch photos page:', error);
        set({ loadError: toLoadError(error), loading: false, photos: [] });
      }
    },

    addPhoto: async (photo) => {
      set({ loading: true });
      try {
        const created = await photosService.create(photo);
        await get().fetchPage(1, get().pageSize);
        set({ loading: false });
        return { success: true, data: created };
      } catch (error) {
        set({ loading: false });
        return toSaveError(error);
      }
    },

    updatePhoto: async (id, photo) => {
      set({ loading: true });
      try {
        const updated = await photosService.update(id, photo);
        set((state) => ({
          photos: state.photos.map((p) => (p.id === id ? updated : p)),
          loading: false,
        }));
        return { success: true, data: updated };
      } catch (error) {
        set({ loading: false });
        return toSaveError(error);
      }
    },

    deletePhoto: async (id) => {
      set({ loading: true });
      try {
        const success = await photosService.delete(id);
        if (success) {
          const { currentPage, pageSize, photos } = get();
          let newPage = currentPage;
          if (photos.length === 1 && currentPage > 1) {
            newPage = currentPage - 1;
          }
          await get().fetchPage(newPage, pageSize);
          set({ loading: false });
          return true;
        }
        set({ loading: false });
        return false;
      } catch (error) {
        console.error('Failed to delete photo:', error);
        set({ error: 'Failed to delete photo', loading: false });
        return false;
      }
    },

    goToPage: (page: number) => {
      const { pageSize } = get();
      get().fetchPage(page, pageSize);
    },

    changePageSize: (size: number) => {
      get().fetchPage(1, size);
    },
  }))
);