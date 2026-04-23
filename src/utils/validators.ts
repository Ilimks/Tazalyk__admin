import { config } from "@/config";

export const validators = {
  required: (value: any): string | null => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'Обязательное поле';
    }
    return null;
  },

  minLength: (min: number) => (value: string): string | null => {
    if (value.length < min) {
      return `Минимум ${min} символов`;
    }
    return null;
  },

  maxLength: (max: number) => (value: string): string | null => {
    if (value.length > max) {
      return `Максимум ${max} символов`;
    }
    return null;
  },

  email: (value: string): string | null => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(value)) {
      return 'Неверный формат email';
    }
    return null;
  },

  url: (value: string): string | null => {
    try {
      new URL(value);
      return null;
    } catch {
      return 'Неверный URL';
    }
  },

  number: (value: string): string | null => {
    if (isNaN(Number(value))) {
      return 'Должно быть числом';
    }
    return null;
  },

  positiveNumber: (value: string): string | null => {
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      return 'Должно быть положительным числом';
    }
    return null;
  },

  fileSize: (file: File, maxSize: number = config.upload.maxImageSize): string | null => {
    if (file.size > maxSize) {
      return `Размер файла не должен превышать ${maxSize / (1024 * 1024)}MB`;
    }
    return null;
  },

  fileType: (file: File, allowedTypes: string[]): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `Допустимые типы: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`;
    }
    return null;
  },
};