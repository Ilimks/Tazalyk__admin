import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deferred, json, mockServer, page } from '@/test/server';
import { UPLOAD_LIMITS } from '@/test/fixtures';
import { mockUploads } from '@/test/xhr';
import { config } from '@/config';
import { localToday } from '@/utils/date';
import type { LocalAct } from '@/types';

type Modules = {
  DocumentForm: typeof import('./DocumentForm').DocumentForm;
  useLocalActsStore: typeof import('@/store').useLocalActsStore;
};

let modules: Modules;

const TYPES_HINT = 'PDF, DOC, DOCX, XLS, XLSX или TXT';

const pdf = (name: string, size?: number) => {
  const file = new File(['%PDF-1.7 тестовый документ'], name, { type: 'application/pdf' });
  if (size !== undefined) Object.defineProperty(file, 'size', { value: size });
  return file;
};

const renderForm = () => {
  const { DocumentForm, useLocalActsStore } = modules;
  const onSuccess = vi.fn();
  const { container } = render(
    <DocumentForm
      section="local_acts"
      hint="Название и дата публикации на сайте"
      save={(data) => useLocalActsStore.getState().addItem(data)}
      onSuccess={onSuccess}
      onCancel={vi.fn()}
    />,
  );
  const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!fileInput) throw new Error('Нет поля выбора файла');
  return { onSuccess, fileInput, user: userEvent.setup() };
};

describe('Форма документа', () => {
  beforeEach(async () => {
    vi.resetModules();
    const [form, store] = await Promise.all([import('./DocumentForm'), import('@/store')]);
    modules = { DocumentForm: form.DocumentForm, useLocalActsStore: store.useLocalActsStore };
  });

  it('пределы размера берёт из ответа GET /uploads/', async () => {
    const server = mockServer().on('GET', '/uploads/', () => json(UPLOAD_LIMITS));

    renderForm();

    expect(await screen.findByText(`${TYPES_HINT} до 50 МБ`)).toBeInTheDocument();
    expect(server.sent('GET', '/uploads/')).toHaveLength(1);
  });

  it('файл больше предела отклоняет сразу, ничего не отправляя на сервер', async () => {
    mockServer().on('GET', '/uploads/', () => json(UPLOAD_LIMITS));
    const uploads = mockUploads();
    const { fileInput, user } = renderForm();
    await screen.findByText(`${TYPES_HINT} до 50 МБ`);

    await user.upload(fileInput, pdf('Отчёт за год.pdf', UPLOAD_LIMITS.document.maxBytes + 1));

    expect(await screen.findByRole('alert')).toHaveTextContent('«Отчёт за год.pdf»: файл больше 50 МБ');
    expect(uploads).toHaveLength(0);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('файл, выбранный раньше ответа GET /uploads/, тоже проверяет по пределам сервера', async () => {
    const limits = deferred<Response>();
    mockServer().on('GET', '/uploads/', () => limits.promise);
    const uploads = mockUploads();
    const { fileInput, user } = renderForm();

    await user.upload(fileInput, pdf('Отчёт за год.pdf', UPLOAD_LIMITS.document.maxBytes + 1));
    await act(async () => limits.resolve(json(UPLOAD_LIMITS)));

    expect(await screen.findByRole('alert')).toHaveTextContent('«Отчёт за год.pdf»: файл больше 50 МБ');
    expect(uploads).toHaveLength(0);
  });

  it('нормальный файл загружает через XHR с ходом загрузки, показывает в превью и сохраняет документ', async () => {
    const created: LocalAct = {
      id: 'act-1',
      title: 'Положение о закупках',
      file_url: 'https://api.test/media/documents/act-1.pdf',
      file_name: 'Положение о закупках.pdf',
      file_size: 2048,
      date: localToday(),
      created_at: '2026-11-27T05:00:00Z',
    };
    const server = mockServer()
      .on('GET', '/uploads/', () => json(UPLOAD_LIMITS))
      .on('POST', '/local-acts/', () => json(created, 201))
      .on('GET', '/local-acts/', () => json(page([created])));
    const uploads = mockUploads();
    const { onSuccess, fileInput, user } = renderForm();
    await screen.findByText(`${TYPES_HINT} до 50 МБ`);

    await user.upload(fileInput, pdf('Положение о закупках.pdf'));

    expect(uploads).toHaveLength(1);
    const [xhr] = uploads;
    expect(xhr.method).toBe('POST');
    expect(xhr.url).toBe(`${config.api.baseUrl}/uploads/`);
    expect(xhr.withCredentials).toBe(true);
    expect(xhr.body?.get('section')).toBe('local_acts');
    expect(xhr.body?.get('kind')).toBe('document');
    expect((xhr.body?.get('file') as File).name).toBe('Положение о закупках.pdf');

    act(() => xhr.progress(40, 100));
    expect(screen.getByRole('progressbar', { name: 'Загрузка файла' })).toHaveAttribute('aria-valuenow', '40');
    expect(screen.getByText('Загрузка файла: 40%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Добавить' })).toBeDisabled();

    await act(async () => xhr.respond(201, { url: created.file_url, size: created.file_size }));

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('Положение о закупках.pdf')).toBeInTheDocument();
    expect(screen.getByText('2 КБ')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Заменить файл' })).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Название документа' }), created.title);
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(server.sent('POST', '/local-acts/')[0].body).toEqual({
      title: created.title,
      file_url: created.file_url,
      file_name: created.file_name,
      file_size: created.file_size,
      date: created.date,
    });
  });

  it('без файла сохранить нельзя: подсказка у файла, запрос не уходит', async () => {
    const server = mockServer().on('GET', '/uploads/', () => json(UPLOAD_LIMITS));
    const { onSuccess, user } = renderForm();

    await user.type(screen.getByRole('textbox', { name: 'Название документа' }), 'Положение о закупках');
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Выберите файл документа');
    expect(server.sent('POST', '/local-acts/')).toHaveLength(0);
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
