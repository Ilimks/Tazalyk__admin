import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deferred, json, mockServer, page } from '@/test/server';
import { makeOrder } from '@/test/fixtures';
import { clearSessionData, useAuthStore } from '@/store';
import { NotificationContainer } from '@/components/common/Notification';
import { OrdersManager } from '../OrdersManager';
import type { Order } from '@/types';

const initialAuth = useAuthStore.getState();

const startServer = (order: Order) => {
  let current = order;
  const server = mockServer().on('GET', '/shop/orders/', ({ query }) =>
    json(page(query.get('status') === 'new' && current.status !== 'new' ? [] : [current])),
  );
  return {
    server,
    update: (next: Order) => {
      current = next;
    },
  };
};

const openOrder = async (user: ReturnType<typeof userEvent.setup>, id: number) => {
  await user.click(await screen.findByRole('row', { name: new RegExp(`№ ${id}`) }));
  return screen.findByRole('dialog', { name: `Заказ № ${id}` });
};

describe('Заказ: смена статуса', () => {
  beforeEach(() => {
    useAuthStore.setState((state) => ({
      isAuthenticated: true,
      permissions: { ...state.permissions, canViewOrders: true, canEditOrders: true },
    }));
  });

  afterEach(() => {
    clearSessionData();
    useAuthStore.setState(initialAuth, true);
  });

  it('новый статус уходит PATCH-запросом, а ответ сервера отражается в списке', async () => {
    const order = makeOrder({ id: 7, status: 'new', status_label: 'Новый' });
    const saved = { ...order, status: 'paid' as const, status_label: 'Оплачен', updated_at: '2026-11-27T05:00:00Z' };
    const reply = deferred<Response>();
    const { server, update } = startServer(order);
    server.on('PATCH', '/shop/orders/7/', () => reply.promise);
    const user = userEvent.setup();
    render(
      <>
        <OrdersManager />
        <NotificationContainer />
      </>,
    );

    const dialog = await openOrder(user, 7);
    await user.selectOptions(within(dialog).getByRole('combobox', { name: 'Статус заказа' }), 'paid');
    await user.click(within(dialog).getByRole('button', { name: 'Сохранить' }));

    expect(server.sent('PATCH', '/shop/orders/7/')).toHaveLength(1);
    expect(server.sent('PATCH', '/shop/orders/7/')[0].body).toEqual({ status: 'paid' });
    const row = screen.getByRole('row', { name: /№ 7/ });
    expect(within(row).getByText('Новый')).toBeInTheDocument();

    update(saved);
    reply.resolve(json(saved));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(within(screen.getByRole('row', { name: /№ 7/ })).getByText('Оплачен')).toBeInTheDocument();
    expect(await screen.findByText('Заказ № 7 сохранён')).toBeInTheDocument();
  });

  it('если сервер отклонил статус, ошибка видна у поля, окно остаётся открытым', async () => {
    const order = makeOrder({ id: 7 });
    const refusal = 'Значение «cancelled» не является верным выбором.';
    const { server } = startServer(order);
    server.on('PATCH', '/shop/orders/7/', () => json({ status: [refusal] }, 400));
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    onTestFinished(() => logged.mockRestore());
    const user = userEvent.setup();
    render(<OrdersManager />);

    const dialog = await openOrder(user, 7);
    const status = within(dialog).getByRole('combobox', { name: 'Статус заказа' });
    await user.selectOptions(status, 'cancelled');
    await user.click(within(dialog).getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => expect(status).toHaveAccessibleDescription(refusal));
    expect(screen.getByRole('dialog', { name: 'Заказ № 7' })).toBeInTheDocument();
    expect(within(screen.getByRole('row', { name: /№ 7/ })).getByText('Новый')).toBeInTheDocument();
  });
});
