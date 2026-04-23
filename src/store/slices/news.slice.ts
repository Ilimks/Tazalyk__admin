import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { newsService } from '@/api/services/news.service';
import type { News } from '@/types';

interface NewsState {
  news: News[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  fetchPage: (page?: number, pageSize?: number) => Promise<void>;
  addNews: (newsItem: Omit<News, 'id' | 'createdAt'>) => Promise<boolean>;
  updateNews: (id: string, newsItem: Partial<News>) => Promise<boolean>;
  deleteNews: (id: string) => Promise<boolean>;
  goToPage: (page: number) => void;
  changePageSize: (size: number) => void;
}

export const useNewsStore = create<NewsState>()(
  devtools((set, get) => ({
    news: [],
    loading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 12,

    fetchPage: async (page = 1, pageSize = 12) => {
      set({ loading: true, error: null });
      try {
        const response = await newsService.getPage(page, pageSize);
        set({ 
          news: response.results,
          totalCount: response.count,
          currentPage: page,
          pageSize: pageSize,
          loading: false 
        });
      } catch (error) {
        console.error('Failed to fetch news page:', error);
        set({ error: 'Failed to fetch news', loading: false, news: [] });
      }
    },

    addNews: async (newsItem) => {
      set({ loading: true });
      try {
        const newNews = await newsService.create(newsItem);
        if (newNews) {
          await get().fetchPage(1, get().pageSize);
          set({ loading: false });
          return true;
        }
        set({ loading: false });
        return false;
      } catch (error) {
        console.error('Failed to add news:', error);
        set({ error: 'Failed to add news', loading: false });
        return false;
      }
    },

    updateNews: async (id, newsItem) => {
      set({ loading: true });
      try {
        const updatedNews = await newsService.update(id, newsItem);
        if (updatedNews) {
          set((state) => ({
            news: state.news.map((n) => (n.id === id ? updatedNews : n)),
            loading: false,
          }));
          return true;
        }
        set({ loading: false });
        return false;
      } catch (error) {
        console.error('Failed to update news:', error);
        set({ error: 'Failed to update news', loading: false });
        return false;
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

    goToPage: (page: number) => {
      const { pageSize } = get();
      get().fetchPage(page, pageSize);
    },

    changePageSize: (size: number) => {
      get().fetchPage(1, size);
    },
  }))
);