import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { photosService } from '@/api/services/photos.service';
import type { Photo } from '@/types';

interface PhotosState {
  photos: Photo[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  fetchPage: (page?: number, pageSize?: number) => Promise<void>;
  addPhoto: (photo: Omit<Photo, 'id' | 'created_at'>) => Promise<boolean>;
  updatePhoto: (id: string, photo: Partial<Photo>) => Promise<boolean>;
  deletePhoto: (id: string) => Promise<boolean>;
  goToPage: (page: number) => void;
  changePageSize: (size: number) => void;
}

export const usePhotosStore = create<PhotosState>()(
  devtools((set, get) => ({
    photos: [],
    loading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 8,

    fetchPage: async (page = 1, pageSize = 8) => {
      set({ loading: true, error: null });
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
        console.error('Failed to fetch photos page:', error);
        set({ error: 'Failed to fetch photos', loading: false, photos: [] });
      }
    },

    addPhoto: async (photo) => {
      set({ loading: true });
      try {
        const newPhoto = await photosService.create(photo);
        if (newPhoto) {
          await get().fetchPage(1, get().pageSize);
          set({ loading: false });
          return true;
        }
        set({ loading: false });
        return false;
      } catch (error) {
        console.error('Failed to add photo:', error);
        set({ error: 'Failed to add photo', loading: false });
        return false;
      }
    },

    updatePhoto: async (id, photo) => {
      set({ loading: true });
      try {
        const updatedPhoto = await photosService.update(id, photo);
        if (updatedPhoto) {
          set((state) => ({
            photos: state.photos.map((p) => (p.id === id ? updatedPhoto : p)),
            loading: false,
          }));
          return true;
        }
        set({ loading: false });
        return false;
      } catch (error) {
        console.error('Failed to update photo:', error);
        set({ error: 'Failed to update photo', loading: false });
        return false;
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