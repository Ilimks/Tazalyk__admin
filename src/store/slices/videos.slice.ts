import { create } from 'zustand';
import { isMissingPage, toLoadError, toSaveError } from '@/utils/apiErrors';
import { devtools } from 'zustand/middleware';
import { videosService } from '@/api/services/videos.service';
import type { SaveResult, Video } from '@/types';

interface VideosState {
  videos: Video[];
  loading: boolean;
  loadError: string | null;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  fetchPage: (page?: number, pageSize?: number) => Promise<void>;
  addVideo: (video: Omit<Video, 'created_at'>) => Promise<SaveResult<Video>>;
  updateVideo: (id: string, video: Partial<Video>) => Promise<SaveResult<Video>>;
  deleteVideo: (id: string) => Promise<boolean>;
  goToPage: (page: number) => void;
  changePageSize: (size: number) => void;
}

export const useVideosStore = create<VideosState>()(
  devtools((set, get) => ({
    videos: [],
    loading: false,
    loadError: null,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 8,

    fetchPage: async (page = 1, pageSize = 8) => {
      set({ loading: true, error: null, loadError: null });
      try {
        const response = await videosService.getPage(page, pageSize);
        set({ 
          videos: response.results,
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
        console.error('Failed to fetch videos page:', error);
        set({ loadError: toLoadError(error), loading: false, videos: [] });
      }
    },

    addVideo: async (video) => {
      set({ loading: true });
      try {
        const videoWithId = {
          ...video,
          id: video.id || Date.now().toString(),
        };
        
        const created = await videosService.create(videoWithId);
        await get().fetchPage(1, get().pageSize);
        set({ loading: false });
        return { success: true, data: created };
      } catch (error) {
        set({ loading: false });
        return toSaveError(error);
      }
    },

    updateVideo: async (id, video) => {
      set({ loading: true });
      try {
        const updated = await videosService.update(id, video);
        set((state) => ({
          videos: state.videos.map((v) => (v.id === id ? updated : v)),
          loading: false,
        }));
        return { success: true, data: updated };
      } catch (error) {
        set({ loading: false });
        return toSaveError(error);
      }
    },

    deleteVideo: async (id) => {
      set({ loading: true });
      try {
        const success = await videosService.delete(id);
        if (success) {
          const { currentPage, pageSize, videos } = get();
          let newPage = currentPage;
          if (videos.length === 1 && currentPage > 1) {
            newPage = currentPage - 1;
          }
          await get().fetchPage(newPage, pageSize);
          set({ loading: false });
          return true;
        }
        set({ loading: false });
        return false;
      } catch (error) {
        console.error('Failed to delete video:', error);
        set({ error: 'Failed to delete video', loading: false });
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