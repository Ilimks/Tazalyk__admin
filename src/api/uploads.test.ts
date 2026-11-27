import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UPLOAD_LIMITS } from '@/test/fixtures';
import { json, mockServer } from '@/test/server';
import { checkFile, dataUrlToBlob, formatLimit } from './uploads';

const fileOfSize = (name: string, type: string, size: number) => {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

const readText = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });

describe('checkFile — проверка файла до отправки', () => {
  const limit = UPLOAD_LIMITS.document;

  it('пропускает файл подходящего типа в пределах лимита, включая ровно лимит', () => {
    expect(checkFile(fileOfSize('akt.pdf', 'application/pdf', 1024), limit)).toBeNull();
    expect(checkFile(fileOfSize('akt.pdf', 'application/pdf', limit.maxBytes), limit)).toBeNull();
  });

  it('отклоняет файл больше лимита и называет лимит в мегабайтах', () => {
    expect(checkFile(fileOfSize('big.pdf', 'application/pdf', limit.maxBytes + 1), limit)).toBe(
      '«big.pdf»: файл больше 50 МБ',
    );
  });

  it('отклоняет тип, которого нет в списке сервера', () => {
    expect(checkFile(fileOfSize('setup.exe', 'application/x-msdownload', 1024), limit)).toBe(
      '«setup.exe»: такой тип файла не принимается',
    );
  });

  it('отклоняет пустой файл даже без известных пределов', () => {
    expect(checkFile(fileOfSize('empty.pdf', 'application/pdf', 0), limit)).toBe('«empty.pdf»: файл пустой');
    expect(checkFile(fileOfSize('empty.pdf', 'application/pdf', 0), undefined)).toBe('«empty.pdf»: файл пустой');
  });

  it('без пределов сервера не отклоняет непустой файл — решает сервер', () => {
    expect(checkFile(fileOfSize('akt.pdf', 'application/pdf', 1024), undefined)).toBeNull();
  });
});

describe('dataUrlToBlob — фото из сжатия в файл для загрузки', () => {
  it('восстанавливает тип и содержимое из data URL', async () => {
    const blob = dataUrlToBlob('data:text/plain;base64,0J/RgNC40LLQtdGC');

    expect(blob.type).toBe('text/plain');
    expect(blob.size).toBe(12);
    expect(await readText(blob)).toBe('Привет');
  });

  it('сохраняет двоичные байты без искажений', async () => {
    const blob = dataUrlToBlob('data:image/jpeg;base64,/9j/4AAQ');
    const bytes = new Uint8Array(
      await new Promise<ArrayBuffer>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.readAsArrayBuffer(blob);
      }),
    );

    expect(blob.type).toBe('image/jpeg');
    expect(Array.from(bytes)).toEqual([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  });

  it('без указанного типа помечает данные как application/octet-stream', () => {
    expect(dataUrlToBlob('data:;base64,AAE=').type).toBe('application/octet-stream');
  });
});

describe('loadUploadLimit — пределы сервера для вида файла', () => {
  let loadUploadLimit: typeof import('./uploads').loadUploadLimit;

  beforeEach(async () => {
    vi.resetModules();
    ({ loadUploadLimit } = await import('./uploads'));
  });

  it('берёт предел нужного вида из GET /uploads/ и спрашивает сервер один раз', async () => {
    const server = mockServer().on('GET', '/uploads/', () => json(UPLOAD_LIMITS));

    expect(await loadUploadLimit('document')).toEqual(UPLOAD_LIMITS.document);
    expect(await loadUploadLimit('image')).toEqual(UPLOAD_LIMITS.image);
    expect(server.sent('GET', '/uploads/')).toHaveLength(1);
  });

  it('если сервер не ответил, пределов нет, а следующий вызов спрашивает снова', async () => {
    let fail = true;
    const server = mockServer().on('GET', '/uploads/', () =>
      fail ? json({ detail: 'Ошибка сервера' }, 500) : json(UPLOAD_LIMITS),
    );

    expect(await loadUploadLimit('document')).toBeUndefined();
    fail = false;
    expect(await loadUploadLimit('document')).toEqual(UPLOAD_LIMITS.document);
    expect(server.sent('GET', '/uploads/')).toHaveLength(2);
  });
});

describe('formatLimit — подпись предела для человека', () => {
  it('переводит байты в целые мегабайты', () => {
    expect(formatLimit(UPLOAD_LIMITS.document)).toBe('50 МБ');
    expect(formatLimit(UPLOAD_LIMITS.image)).toBe('20 МБ');
    expect(formatLimit(UPLOAD_LIMITS.video)).toBe('100 МБ');
  });
});
