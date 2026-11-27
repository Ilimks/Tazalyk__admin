import { config } from '@/config';
import { ApiError, apiClient } from './client';

export type UploadSection = 'videos' | 'photos' | 'news' | 'local_acts' | 'legislation';
export type UploadKind = 'image' | 'video' | 'document';

export interface UploadLimit {
  maxBytes: number;
  types: string[];
}

export type UploadLimits = Record<UploadKind, UploadLimit>;

let limits: Promise<UploadLimits> | null = null;

export const loadUploadLimits = (): Promise<UploadLimits> => {
  limits ??= apiClient.get<UploadLimits>('/uploads/').catch((error) => {
    limits = null;
    throw error;
  });
  return limits;
};

export const loadUploadLimit = (kind: UploadKind): Promise<UploadLimit | undefined> =>
  loadUploadLimits().then((all) => all[kind]).catch(() => undefined);

const MB = 1024 * 1024;

export const formatLimit = (limit: UploadLimit) => `${Math.round(limit.maxBytes / MB)} МБ`;

export const checkFile = (file: File, limit: UploadLimit | undefined): string | null => {
  if (file.size === 0) return `«${file.name}»: файл пустой`;
  if (!limit) return null;
  if (!limit.types.includes(file.type)) return `«${file.name}»: такой тип файла не принимается`;
  if (file.size > limit.maxBytes) return `«${file.name}»: файл больше ${formatLimit(limit)}`;
  return null;
};

export const dataUrlToBlob = (dataUrl: string): Blob => {
  const comma = dataUrl.indexOf(',');
  const type = /^data:([^;,]+)/.exec(dataUrl)?.[1] ?? 'application/octet-stream';
  const binary = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
};

interface UploadOptions {
  section: UploadSection;
  kind: UploadKind;
  name: string;
  onProgress?: (ratio: number) => void;
}

interface UploadResult {
  url: string;
  size: number;
}

const send = (file: Blob, { section, kind, name, onProgress }: UploadOptions): Promise<UploadResult> =>
  new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('section', section);
    form.append('kind', kind);
    form.append('file', file, name);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${config.api.baseUrl}/uploads/`);
    xhr.withCredentials = true;
    xhr.timeout = config.upload.timeoutMs;
    xhr.responseType = 'json';
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => {
      const data = (xhr.response ?? {}) as Record<string, unknown>;
      if (xhr.status === 201) {
        resolve(data as unknown as UploadResult);
        return;
      }
      const reason = [data.file, data.kind, data.detail].flat().find((item) => typeof item === 'string');
      reject(new ApiError(xhr.status, typeof reason === 'string' ? reason : `Не удалось загрузить файл (код ${xhr.status})`, data));
    };
    xhr.onerror = () => reject(new ApiError(0, 'Нет связи с сервером. Проверьте интернет и повторите.'));
    xhr.ontimeout = () => reject(new ApiError(408, 'Загрузка заняла слишком много времени. Повторите.'));
    xhr.send(form);
  });

export const uploadFile = async (file: Blob, options: UploadOptions): Promise<UploadResult> => {
  try {
    return await send(file, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && (await apiClient.refreshSession())) {
      return send(file, options);
    }
    throw error;
  }
};
