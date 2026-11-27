import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, LoaderCircle, Trash2, X } from 'lucide-react';
import styles from './FileUpload.module.scss';
import { config } from '@/config';
import { compressImage, formatDataUrlSize } from '@/utils/media';
import { checkFile, dataUrlToBlob, formatLimit, loadUploadLimit, uploadFile, type UploadLimit, type UploadSection } from '@/api/uploads';
import { UploadProgress } from '@/components/common/UploadProgress';

interface ImageUploadProps {
  value?: string | string[];
  onChange: (url: string | string[]) => void;
  onRemove?: () => void;
  label?: string;
  required?: boolean;
  multiple?: boolean;
  section?: UploadSection;
}

const acceptedLabel = config.upload.acceptedImageTypes.map((t) => t.split('/')[1].toUpperCase()).join(', ');
const maxSizeMb = config.upload.maxImageSize / (1024 * 1024);

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onRemove,
  label = 'Изображение',
  required = false,
  multiple = false,
  section,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>(Array.isArray(value) ? value : []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [limit, setLimit] = useState<UploadLimit>();
  const [progress, setProgress] = useState<{ ratio: number; index: number; total: number } | null>(null);

  useEffect(() => {
    if (section) loadUploadLimit('image').then(setLimit);
  }, [section]);

  const validateFile = (file: File, serverLimit: UploadLimit | undefined): string | null => {
    if (serverLimit) return checkFile(file, serverLimit);
    if (!config.upload.acceptedImageTypes.includes(file.type)) {
      return `«${file.name}»: выберите изображение (${acceptedLabel})`;
    }
    if (file.size > config.upload.maxImageSize) {
      return `«${file.name}»: файл больше ${maxSizeMb} МБ`;
    }
    return null;
  };

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setError(null);
    setIsProcessing(true);

    const errors: string[] = [];
    const results: string[] = [];
    const chosen = multiple ? files : files.slice(0, 1);
    const serverLimit = section ? await loadUploadLimit('image') : undefined;
    for (const [index, file] of chosen.entries()) {
      const problem = validateFile(file, serverLimit);
      if (problem) {
        errors.push(problem);
        continue;
      }
      const compressed = await compressImage(file, {
        maxDimension: config.upload.imageMaxDimension,
        quality: config.upload.imageQuality,
      });
      if (!section) {
        results.push(compressed);
        continue;
      }
      try {
        setProgress({ ratio: 0, index: index + 1, total: chosen.length });
        const blob = dataUrlToBlob(compressed);
        const name = blob.type === file.type ? file.name : file.name.replace(/\.[^.]+$/, '') + '.jpg';
        const { url } = await uploadFile(blob, {
          section,
          kind: 'image',
          name,
          onProgress: (ratio) => setProgress({ ratio, index: index + 1, total: chosen.length }),
        });
        results.push(url);
      } catch (uploadError) {
        errors.push(`«${file.name}»: ${(uploadError as Error).message}`);
      }
    }

    setProgress(null);
    setIsProcessing(false);
    if (errors.length) setError(errors.join('. '));
    if (!results.length) return;

    if (multiple) {
      const newGallery = [...galleryImages, ...results];
      setGalleryImages(newGallery);
      onChange(newGallery);
    } else {
      onChange(results[0]);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await processFiles(Array.from(e.dataTransfer.files));
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await processFiles(Array.from(e.target.files || []));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeGalleryImage = (index: number) => {
    const newGallery = galleryImages.filter((_, i) => i !== index);
    setGalleryImages(newGallery);
    onChange(newGallery);
  };

  const handleRemoveSingle = () => {
    if (onRemove) onRemove();
    else onChange('');
  };

  const dropzone = (
    <div
      className={`${styles.uploadArea} ${isDragging ? styles.dragging : ''} ${isProcessing ? styles.processing : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !isProcessing && fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInputRef.current?.click();
        }
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={config.upload.acceptedImageTypes.join(',')}
        onChange={handleChange}
        className={styles.hiddenInput}
        multiple={multiple}
      />
      <div className={styles.uploadContent}>
        <span className={styles.uploadIcon}>
          {isProcessing ? <LoaderCircle className={styles.spin} size={24} /> : <ImagePlus size={24} />}
        </span>
        <span className={styles.uploadTitle}>
          {isProcessing ? 'Обрабатываем фото…' : multiple ? 'Нажмите или перетащите фото' : 'Нажмите или перетащите файл'}
        </span>
        <span className={styles.uploadHint}>
          {acceptedLabel} до {limit ? formatLimit(limit) : `${maxSizeMb} МБ`} · большие фото уменьшаются автоматически
        </span>
      </div>
    </div>
  );

  return (
    <div className={styles.uploadContainer}>
      {label && (
        <label className={styles.label}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
      )}

      {multiple ? (
        <>
          {dropzone}
          {galleryImages.length > 0 && (
            <div className={styles.galleryPreviewGrid}>
              {galleryImages.map((img, index) => (
                <div key={index} className={styles.galleryPreviewItem}>
                  <img src={img} alt={`Фото ${index + 1}`} loading="lazy" decoding="async" />
                  <button
                    type="button"
                    className={styles.removeGalleryBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeGalleryImage(index);
                    }}
                    aria-label={`Удалить фото ${index + 1}`}
                    title="Удалить"
                  >
                    <X size={14} />
                  </button>
                  {img.startsWith('data:') && <span className={styles.sizeBadge}>{formatDataUrlSize(img)}</span>}
                </div>
              ))}
            </div>
          )}
        </>
      ) : value && typeof value === 'string' ? (
        <div className={styles.previewContainer}>
          <img src={value} alt="Выбранное фото" className={styles.preview} decoding="async" />
          <div className={styles.previewBar}>
            <span className={styles.previewSize}>{value.startsWith('data:') ? formatDataUrlSize(value) : 'Текущее фото'}</span>
            <button type="button" className={styles.previewRemove} onClick={handleRemoveSingle}>
              <Trash2 size={16} />
              Удалить
            </button>
          </div>
        </div>
      ) : (
        dropzone
      )}

      {progress && (
        <UploadProgress
          ratio={progress.ratio}
          label={progress.total > 1 ? `Загрузка фото ${progress.index} из ${progress.total}` : 'Загрузка фото'}
        />
      )}
      {error && <span className={styles.errorMessage} role="alert">{error}</span>}
    </div>
  );
};
