import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { json, mockServer, page } from '@/test/server';
import { useAuthStore } from '@/store';
import { AdminPanel } from './AdminPanel';

const initialAuth = useAuthStore.getState();

const startServer = () =>
  mockServer()
    .on('GET', '/health/', () => json({ status: 'ok', message: 'Server is running' }));

const fillLogin = async (user: ReturnType<typeof userEvent.setup>, username: string, password: string) => {
  await user.type(screen.getByLabelText('Логин'), username);
  await user.type(screen.getByLabelText('Пароль'), password);
  await user.click(screen.getByRole('button', { name: 'Войти' }));
};

describe('Вход в админ-панель', () => {
  afterEach(() => {
    useAuthStore.setState(initialAuth, true);
  });

  it('неверный пароль — форма остаётся, видно сообщение об отказе сервера', async () => {
    const server = startServer().on('POST', '/token/', () =>
      json({ detail: 'Не найдено активной учётной записи с указанными данными' }, 401),
    );
    const user = userEvent.setup();
    render(<AdminPanel />);

    await fillLogin(user, 'test-editor', 'wrong-password');

    expect(await screen.findByRole('alert')).toHaveTextContent('Неверный логин или пароль');
    expect(screen.getByRole('heading', { name: 'Вход в админ-панель' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Войти' })).toBeEnabled();
    expect(server.sent('POST', '/token/')[0].body).toEqual({ username: 'test-editor', password: 'wrong-password' });
    expect(server.sent('GET', '/me/')).toHaveLength(0);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('верный пароль — открывается панель с разделами по правам учётной записи', async () => {
    const server = startServer()
      .on('POST', '/token/', () => json({ ok: true }))
      .on('GET', '/me/', () => json({ username: 'test-editor', is_superuser: false, groups: ['content_managers'] }))
      .on('GET', '/news/', () => json(page([])))
      .on('GET', '/photos/', () => json(page([])))
      .on('GET', '/videos/', () => json(page([])))
      .on('GET', '/site-settings/', () => json({ winter_effects: false, updated_at: '2026-11-27T03:00:00Z' }));
    const user = userEvent.setup();
    render(<AdminPanel />);

    await fillLogin(user, ' test-editor ', 'test-password-123');

    expect(await screen.findByRole('heading', { level: 1, name: /test-editor/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Вход в админ-панель' })).not.toBeInTheDocument();
    const sidebar = screen.getByRole('complementary', { name: 'Разделы админ-панели' });
    expect(sidebar).toHaveTextContent('Новости');
    expect(sidebar).toHaveTextContent('Фото');
    expect(sidebar).toHaveTextContent('Видео');
    expect(sidebar).not.toHaveTextContent('Заказы');
    expect(screen.getByRole('button', { name: 'Выйти' })).toBeInTheDocument();
    expect(server.sent('POST', '/token/')[0].body).toEqual({ username: 'test-editor', password: 'test-password-123' });
    expect(JSON.parse(localStorage.getItem('current_user') ?? '{}')).toMatchObject({ username: 'test-editor', role: 'content_manager' });
    expect(await screen.findByRole('switch', { name: 'Зимнее оформление сайта' })).not.toBeChecked();
  });
});
