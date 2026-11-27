import { create } from 'zustand';
import { isMissingPage, toLoadError, toSaveError } from '@/utils/apiErrors';
import { devtools } from 'zustand/middleware';
import { newsService } from '@/api/services/news.service';
import type { News, SaveResult } from '@/types';

interface NewsState {
  news: News[];
  loading: boolean;
  loadError: string | null;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  search: string;
  fetchPage: (page?: number, pageSize?: number) => Promise<void>;
  setSearch: (search: string) => void;
  addNews: (newsItem: Omit<News, 'id' | 'createdAt'>) => Promise<SaveResult<News>>;
  updateNews: (id: string, newsItem: Partial<News>) => Promise<SaveResult<News>>;
  deleteNews: (id: string) => Promise<boolean>;
  goToPage: (page: number) => void;
  changePageSize: (size: number) => void;
}

let lastRequest = 0;

export const useNewsStore = create<NewsState>()(
  devtools((set, get) => ({
    news: [],
    loading: false,
    loadError: null,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 12,
    search: '',

    fetchPage: async (page = 1, pageSize = 12) => {
      const requestId = ++lastRequest;
      set({ loading: true, error: null, loadError: null });
      try {
        const response = await newsService.getPage(page, pageSize, get().search);
        if (requestId !== lastRequest) return;
        set({ 
          news: response.results,
          totalCount: response.count,
          currentPage: page,
          pageSize: pageSize,
          loading: false 
        });
      } catch (error) {
        if (requestId !== lastRequest) return;
        if (isMissingPage(error) && page > 1) {
          get().fetchPage(page - 1, pageSize);
          return;
        }
        console.error('Failed to fetch news page:', error);
        set({ loadError: toLoadError(error), loading: false, news: [] });
      }
    },

    addNews: async (newsItem) => {
      set({ loading: true });
      try {
        const created = await newsService.create(newsItem);
        await get().fetchPage(1, get().pageSize);
        set({ loading: false });
        return { success: true, data: created };
      } catch (error) {
        set({ loading: false });
        return toSaveError(error);
      }
    },

    updateNews: async (id, newsItem) => {
      set({ loading: true });
      try {
        const updated = await newsService.update(id, newsItem);
        set((state) => ({
          news: state.news.map((n) => (n.id === id ? updated : n)),
          loading: false,
        }));
        return { success: true, data: updated };
      } catch (error) {
        set({ loading: false });
        return toSaveError(error);
      }
    },

    deleteNews: async (id) => {
      set({ loading: true });
      try {
        const success = await newsService.delete(id);
        if (success) {
          const { currentPage, pageSize, news } = get();
          let newPage = currentPage;
          if (news.length === 1 && currentPage > 1) {
            newPage = currentPage - 1;
          }
          await get().fetchPage(newPage, pageSize);
          set({ loading: false });
          return true;
        }
        set({ loading: false });
        return false;
      } catch (error) {
        console.error('Failed to delete news:', error);
        set({ error: 'Failed to delete news', loading: false });
        return false;
      }
    },

    setSearch: (search) => {
      set({ search });
      get().fetchPage(1, get().pageSize);
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