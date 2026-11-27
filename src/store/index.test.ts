import { describe, expect, it } from 'vitest';
import { json, mockServer, page } from '@/test/server';
import { makeOrder } from '@/test/fixtures';
import { signOut, useAuthStore, useNewsStore, useOrdersStore } from './index';
import type { News, User } from '@/types';

const user: User = {
  id: 'test-manager',
  username: 'test-manager',
  role: 'shop_manager',
  permissions: ['view_orders', 'edit_orders'],
  createdAt: '2026-11-27T03:00:00Z',
};

const news: News = {
  id: 'n-1',
  title_ru: 'Тестовая новость',
  description_ru: 'Текст тестовой новости',
  image: '',
  date: '2026-11-27',
  createdAt: '2026-11-27T03:00:00Z',
};

describe('Выход из админ-панели', () => {
  it('signOut очищает данные разделов, загруженные с сервера, и завершает сессию', async () => {
    const server = mockServer()
      .on('GET', '/shop/orders/', ({ query }) =>
        json(query.get('status') === 'new' ? { ...page([makeOrder()]), count: 3 } : page([makeOrder(), makeOrder({ id: 8 })])),
      )
      .on('GET', '/news/', () => json(page([news])))
      .on('POST', '/token/logout/', () => json({}, 204));

    useAuthStore.setState({ isAuthenticated: true, user });
    localStorage.setItem('current_user', JSON.stringify(user));
    useOrdersStore.setState({ search: 'Покупатель' });
    await useOrdersStore.getState().fetchPage(1, 10);
    await useOrdersStore.getState().fetchNewCount();
    await useNewsStore.getState().fetchPage(1, 12);

    expect(useOrdersStore.getState()).toMatchObject({ totalCount: 2, newCount: 3, search: 'Покупатель' });
    expect(useOrdersStore.getState().orders).toHaveLength(2);
    expect(useNewsStore.getState().news).toHaveLength(1);

    signOut();

    expect(useOrdersStore.getState()).toMatchObject({
      orders: [],
      totalCount: 0,
      newCount: null,
      currentPage: 1,
      status: '',
      search: '',
    });
    expect(useNewsStore.getState()).toMatchObject({ news: [], totalCount: 0 });
    expect(useAuthStore.getState()).toMatchObject({ isAuthenticated: false, user: null });
    expect(localStorage.getItem('current_user')).toBeNull();
    expect(server.sent('POST', '/token/logout/')).toHaveLength(1);
  });

  it('после выхода разделы снова могут загружать данные', async () => {
    mockServer()
      .on('GET', '/shop/orders/', () => json(page([makeOrder({ id: 9 })])))
      .on('POST', '/token/logout/', () => json({}, 204));

    signOut();
    await useOrdersStore.getState().fetchPage(1, 10);

    expect(useOrdersStore.getState().orders.map((order) => order.id)).toEqual([9]);
  });
});
