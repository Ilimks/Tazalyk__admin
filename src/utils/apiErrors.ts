import { ApiError } from '@/api/client';
import type { SaveResult } from '@/types';

// Ошибка сохранения для формы. DRF при 400 отвечает {поле: ["текст", …]},
// общие ошибки приходят в non_field_errors или detail.
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
    // нет связи, таймаут, истёкшая сессия — у клиента уже есть понятный текст
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
