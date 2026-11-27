import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { splitSaveErrors, toLoadError, toSaveError } from './apiErrors';

describe('toSaveError — ошибка сохранения для формы', () => {
  it('раскладывает ответ 400 по полям, а общие замечания сервера выносит в сообщение', () => {
    const error = new ApiError(400, 'HTTP 400', {
      title_ru: ['Убедитесь, что это значение содержит не более 255 символов.'],
      date: 'Неправильный формат date.',
      non_field_errors: ['Такая новость уже есть.'],
    });

    expect(toSaveError(error)).toEqual({
      success: false,
      message: 'Такая новость уже есть.',
      fieldErrors: {
        title_ru: 'Убедитесь, что это значение содержит не более 255 символов.',
        date: 'Неправильный формат date.',
      },
    });
  });

  it('при ответе 400 только с ошибками полей просит проверить поля формы', () => {
    const result = toSaveError(new ApiError(400, 'HTTP 400', { description_ru: ['Обязательное поле.'] }));

    expect(result.message).toBe('Проверьте поля формы.');
    expect(result.fieldErrors).toEqual({ description_ru: 'Обязательное поле.' });
  });

  it('ответ 400 с detail показывает текст сервера как общее сообщение', () => {
    const result = toSaveError(new ApiError(400, 'Файл повреждён', { detail: 'Файл повреждён' }));

    expect(result.message).toBe('Файл повреждён');
    expect(result.fieldErrors).toEqual({});
  });

  it.each([
    [403, 'Недостаточно прав для этого действия.'],
    [500, 'Ошибка сервера. Попробуйте позже.'],
    [502, 'Ошибка сервера. Попробуйте позже.'],
  ])('ответ %i превращается в понятное сообщение', (status, message) => {
    expect(toSaveError(new ApiError(status, `HTTP ${status}`))).toEqual({ success: false, message, fieldErrors: {} });
  });

  it('другую ошибку сервера с текстом показывает как есть, а без текста — общей фразой', () => {
    expect(toSaveError(new ApiError(409, 'Запись изменил другой сотрудник')).message).toBe('Запись изменил другой сотрудник');
    expect(toSaveError(new ApiError(409, 'HTTP 409')).message).toBe('Не удалось сохранить. Попробуйте ещё раз.');
  });

  it('не-серверная ошибка даёт общую фразу без ошибок полей', () => {
    expect(toSaveError(new Error('сбой'))).toEqual({
      success: false,
      message: 'Не удалось сохранить. Попробуйте ещё раз.',
      fieldErrors: {},
    });
  });
});

describe('splitSaveErrors — ошибки по полям конкретной формы', () => {
  it('ошибки известных полей ставит к полям, а остальные добавляет к общему сообщению', () => {
    const result = {
      success: false,
      message: 'Проверьте поля формы.',
      fieldErrors: { title: 'Слишком длинное название.', file_name: 'Имя файла не подходит.', slug: 'Адрес занят.' },
    };

    expect(splitSaveErrors(result, { title: 'title', file_name: 'file_url' })).toEqual({
      fieldErrors: { title: 'Слишком длинное название.', file_url: 'Имя файла не подходит.' },
      message: 'Проверьте поля формы. Адрес занят.',
    });
  });

  it('без ошибок полей возвращает только общее сообщение', () => {
    expect(splitSaveErrors({ success: false, message: 'Ошибка сервера. Попробуйте позже.' }, { title: 'title' })).toEqual({
      fieldErrors: {},
      message: 'Ошибка сервера. Попробуйте позже.',
    });
  });
});

describe('toLoadError — ошибка загрузки списка', () => {
  it.each([
    [0, 'Нет связи с сервером. Проверьте интернет или попробуйте позже.'],
    [408, 'Сервер слишком долго не отвечает. Попробуйте ещё раз.'],
    [401, 'Сессия истекла — войдите снова.'],
    [403, 'Недостаточно прав для этого раздела.'],
    [404, 'Такой страницы списка больше нет. Откройте первую страницу.'],
    [500, 'Ошибка на сервере. Попробуйте позже.'],
    [503, 'Ошибка на сервере. Попробуйте позже.'],
  ])('ответ %i объясняется человеческими словами', (status, message) => {
    expect(toLoadError(new ApiError(status, `HTTP ${status}`))).toBe(message);
  });

  it('другую ошибку с текстом сервера показывает как есть, а без текста — общей фразой', () => {
    expect(toLoadError(new ApiError(400, 'Неверный параметр поиска'))).toBe('Неверный параметр поиска');
    expect(toLoadError(new ApiError(400, 'HTTP 400'))).toBe('Не удалось загрузить данные.');
  });

  it('не-серверная ошибка считается неизвестной', () => {
    expect(toLoadError(new Error('сбой'))).toBe('Неизвестная ошибка. Попробуйте ещё раз.');
  });
});
