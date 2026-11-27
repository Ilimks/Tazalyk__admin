import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { json, mockServer, page } from '@/test/server';
import { UPLOAD_LIMITS } from '@/test/fixtures';
import { useNewsStore } from '@/store';
import { localToday } from '@/utils/date';
import { NewsForm } from './NewsForm';
import type { News } from '@/types';

const TOO_LONG = 'Убедитесь, что это значение содержит не более 255 символов.';

const startServer = () => mockServer().on('GET', '/uploads/', () => json(UPLOAD_LIMITS));

const renderForm = () => {
  const onSuccess = vi.fn();
  const onCancel = vi.fn();
  render(<NewsForm onSuccess={onSuccess} onCancel={onCancel} />);
  return { onSuccess, onCancel, user: userEvent.setup() };
};

describe('Форма новости', () => {
  it('успешное сохранение отправляет POST на /news/ и вызывает onSuccess', async () => {
    const created: News = {
      id: 'b6f1c7de-0000-4000-8000-000000000001',
      title_ru: 'График вывоза в праздничные дни',
      description_ru: 'Вывоз мусора 31 декабря и 1 января идёт по обычному графику.',
      title_ky: '',
      description_ky: '',
      image: '',
      date: localToday(),
      createdAt: '2026-11-27T04:00:00Z',
    };
    const server = startServer()
      .on('POST', '/news/', () => json(created, 201))
      .on('GET', '/news/', () => json(page([created])));
    const { onSuccess, user } = renderForm();

    await user.type(screen.getByRole('textbox', { name: 'Заголовок' }), created.title_ru);
    await user.type(screen.getByRole('textbox', { name: 'Описание' }), created.description_ru);
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(server.sent('POST', '/news/')).toHaveLength(1);
    expect(server.sent('POST', '/news/')[0].body).toEqual({
      title_ru: created.title_ru,
      description_ru: created.description_ru,
      title_ky: '',
      description_ky: '',
      date: localToday(),
      image: '',
    });
    expect(useNewsStore.getState().news).toEqual([created]);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('ошибку 400 по заголовку показывает у поля заголовка и не закрывает форму', async () => {
    const server = startServer().on('POST', '/news/', () => json({ title_ru: [TOO_LONG] }, 400));
    const { onSuccess, user } = renderForm();
    const title = screen.getByRole('textbox', { name: 'Заголовок' });

    await user.click(title);
    await user.paste('Очень длинный заголовок '.repeat(11));
    await user.type(screen.getByRole('textbox', { name: 'Описание' }), 'Описание новости');
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    await vi.waitFor(() => expect(title).toHaveAccessibleDescription(TOO_LONG));
    expect(title).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Проверьте поля формы.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Добавить' })).toBeEnabled();
    expect(server.sent('POST', '/news/')).toHaveLength(1);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('без заголовка и описания ничего не отправляет и подсказывает, что заполнить', async () => {
    const server = startServer();
    const { onSuccess, user } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(screen.getByRole('textbox', { name: 'Заголовок' })).toHaveAccessibleDescription('Введите заголовок на русском');
    expect(screen.getByRole('textbox', { name: 'Описание' })).toHaveAccessibleDescription('Введите описание на русском');
    expect(server.sent('POST', '/news/')).toHaveLength(0);
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
