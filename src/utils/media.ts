// Обработка медиа в браузере до отправки на сервер.
// Сервер хранит файлы строками base64 в базе, поэтому чем меньше файл, тем быстрее
// работают и админка, и сайт.

const readAsDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Не удалось прочитать изображение'));
    img.src = src;
  });

const canvasToDataUrl = (canvas: HTMLCanvasElement, quality: number): Promise<string> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? readAsDataUrl(blob).then(resolve, reject) : reject(new Error('Не удалось сжать изображение'))),
      'image/jpeg',
      quality
    );
  });

const fitSize = (width: number, height: number, maxDimension: number) => {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
};

interface CompressOptions {
  maxDimension: number;
  quality: number;
}

// Уменьшает фото до maxDimension по длинной стороне и сохраняет в JPEG.
// GIF не трогаем (анимация пропала бы), а если сжатие не дало выигрыша — оставляем оригинал.
export const compressImage = async (file: File, { maxDimension, quality }: CompressOptions): Promise<string> => {
  const original = await readAsDataUrl(file);
  if (file.type === 'image/gif') return original;

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const { width, height } = fitSize(img.naturalWidth, img.naturalHeight, maxDimension);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return original;

    // белый фон вместо прозрачности PNG — JPEG её не поддерживает
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const compressed = await canvasToDataUrl(canvas, quality);
    return compressed.length < original.length ? compressed : original;
  } catch {
    return original;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

// Снимает кадр из видео (около 1-й секунды) и возвращает JPEG data URL для превью.
// source — File, data URL или адрес видео на сервере.
export const captureVideoThumbnail = (source: File | string, maxDimension = 960, quality = 0.8): Promise<string | null> =>
  new Promise((resolve) => {
    const url = typeof source === 'string' ? source : URL.createObjectURL(source);
    const video = document.createElement('video');
    let settled = false;

    const finish = (result: string | null) => {
      if (settled) return;
      settled = true;
      if (typeof source !== 'string') URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
      resolve(result);
    };

    // если браузер не смог прочитать видео за 15 секунд — обходимся без превью
    const timer = window.setTimeout(() => finish(null), 15000);

    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    // файл с сервера API: без этого браузер не даст прочитать кадр на canvas
    if (typeof source === 'string' && source.startsWith('http')) video.crossOrigin = 'anonymous';

    video.onloadedmetadata = () => {
      const target = Number.isFinite(video.duration) ? Math.min(1, video.duration / 10) : 0;
      video.currentTime = target;
    };

    video.onseeked = () => {
      window.clearTimeout(timer);
      const { width, height } = fitSize(video.videoWidth, video.videoHeight, maxDimension);
      if (!width || !height) {
        finish(null);
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        finish(null);
        return;
      }
      ctx.drawImage(video, 0, 0, width, height);
      canvasToDataUrl(canvas, quality).then(finish, () => finish(null));
    };

    video.onerror = () => {
      window.clearTimeout(timer);
      finish(null);
    };

    video.src = url;
  });

// Размер строки base64 в человекочитаемом виде (для подсказок в форме)
export const formatDataUrlSize = (dataUrl: string): string => {
  const base64Length = dataUrl.length - dataUrl.indexOf(',') - 1;
  const bytes = Math.round((base64Length * 3) / 4);
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
};
