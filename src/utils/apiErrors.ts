import { ApiError } from '@/api/client';
import type { SaveResult } from '@/types';

export const isMissingPage = (error: unknown): boolean => error instanceof ApiError && error.status === 404;

export const toLoadError = (error: unknown): string => {
  if (!(error instanceof ApiError)) return 'Неизвестная ошибка. Попробуйте ещё раз.';
  if (error.status === 0) return 'Нет связи с сервером. Проверьте интернет или попробуйте позже.';
  if (error.status === 408) return 'Сервер слишком долго не отвечает. Попробуйте ещё раз.';
  if (error.status === 401) return 'Сессия истекла — войдите снова.';
  if (error.status === 403) return 'Недостаточно прав для этого раздела.';
  if (error.status === 404) return 'Такой страницы списка больше нет. Откройте первую страницу.';
  if (error.status >= 500) return 'Ошибка на сервере. Попробуйте позже.';
  return error.message && !error.message.startsWith('HTTP ') ? error.message : 'Не удалось загрузить данные.';
};

export const toSaveError = (error: unknown): SaveResult<never> => {
  const fieldErrors: Record<string, string> = {};
  let message = 'Не удалось сохранить. Попробуйте ещё раз.';

  if (!(error instanceof ApiError)) {
    return { success: false, message, fieldErrors };
  }

  if (error.status === 403) {
    message = 'Недостаточно прав для этого действия.';
  } else if (error.status >= 500) {
    message = 'Ошибка сервера. Попробуйте позже.';
  } else if (error.status !== 400 && error.message && !error.message.startsWith('HTTP ')) {
    message = error.message;
  }

  const data = error.data;
  if (error.status === 400 && data && typeof data === 'object' && !Array.isArray(data)) {
    const general: string[] = [];
    Object.entries(data as Record<string, unknown>).forEach(([field, value]) => {
      const text = Array.isArray(value) ? value.filter((v) => typeof v === 'string').join(' ') : typeof value === 'string' ? value : '';
      if (!text) return;
      if (field === 'non_field_errors' || field === 'detail') general.push(text);
      else fieldErrors[field] = text;
    });
    message = general.length ? general.join(' ') : 'Проверьте поля формы.';
  }

  return { success: false, message, fieldErrors };
};

export const splitSaveErrors = (result: SaveResult, fields: Record<string, string>) => {
  const fieldErrors: Record<string, string> = {};
  const other: string[] = [];
  Object.entries(result.fieldErrors || {}).forEach(([field, text]) => {
    const key = fields[field];
    if (key) fieldErrors[key] = text;
    else other.push(text);
  });
  const message = [result.message, ...other].filter(Boolean).join(' ');
  return { fieldErrors, message };
};
