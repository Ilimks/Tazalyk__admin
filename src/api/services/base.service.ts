import { apiClient, ApiError } from '../client';
import type { PaginatedResponse, PaginationParams } from '@/types';

export class BaseService<T> {
  constructor(protected endpoint: string) {
    if (!this.endpoint.startsWith('/')) {
      this.endpoint = '/' + this.endpoint;
    }
    if (!this.endpoint.endsWith('/')) {
      this.endpoint = this.endpoint + '/';
    }
  }

  async getPaginated(params?: PaginationParams): Promise<PaginatedResponse<T>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
      if (params?.search) queryParams.append('search', params.search);
      
      const url = queryParams.toString() 
        ? `${this.endpoint}?${queryParams.toString()}`
        : this.endpoint;
      
      return await apiClient.get<PaginatedResponse<T>>(url);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async getById(id: string): Promise<T | null> {
    try {
      return await apiClient.get<T>(`${this.endpoint}${id}/`);
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  create(data: Partial<T>): Promise<T> {
    return apiClient.post<T>(this.endpoint, data);
  }

  update(id: string, data: Partial<T>): Promise<T> {
    return apiClient.put<T>(`${this.endpoint}${id}/`, data);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`${this.endpoint}${id}/`);
      return true;
    } catch (error) {
      this.handleError(error);
      return false;
    }
  }

  protected handleError(error: unknown): void {
    if (error instanceof ApiError) {
      console.error(`API Error ${error.status}:`, error.message);
    } else {
      console.error('Unknown error:', error);
    }
  }
}