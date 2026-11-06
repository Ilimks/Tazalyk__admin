import React, { useRef, useState } from 'react';
import { Clapperboard, LoaderCircle, Trash2, X } from 'lucide-react';
import styles from './FileUpload.module.scss';
import { config } from '@/config';
import { captureVideoThumbnail, formatDataUrlSize } from '@/utils/media';

interface VideoUploadProps {
  value?: string | string[];
  onChange: (url: string | string[]) => void;
  onRemove?: () => void;
  // кадр-превью из выбранного файла (только для одиночного видео)
  onThumbnail?: (thumbnail: string | null) => void;
  label?: string;
  required?: boolean;
  multiple?: boolean;
}

const maxSizeMb = config.upload.maxVideoSize / (1024 * 1024);

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const VideoUpload: React.FC<VideoUploadProps> = ({
  value,
  onChange,
  onRemove,
  onThumbnail,
  label = 'Видео',
  required = false,
  multiple = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [galleryVideos, setGalleryVideos] = useState<string[]>(Array.isArray(value) ? value : []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateVideoFile = (file: File): string | null => {
    if (!config.upload.acceptedVideoTypes.includes(file.type)) {
      return `«${file.name}»: выберите видео (MP4, WebM, OGG, MOV)`;
    }
    if (file.size > config.upload.maxVideoSize) {
      return `«${file.name}»: видео больше ${maxSizeMb} МБ`;
    }
    return null;
  };

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setError(null);
    setIsProcessing(true);

    const errors: string[] = [];
    const results: string[] = [];
    for (const file of multiple ? files : files.slice(0, 1)) {
      const problem = validateVideoFile(file);
      if (problem) {
        errors.push(problem);
        continue;
      }
      if (!multiple && onThumbnail) {
        // кадр снимаем из локального файла — это быстро и не требует загрузки на сервер
        onThumbnail(await captureVideoThumbnail(file));
      }
      results.push(await fileToDataUrl(file));
    }

    setIsProcessing(false);
    if (errors.length) setError(errors.join('. '));
    if (!results.length) return;

    if (multiple) {
      const newGallery = [...galleryVideos, ...results];
      setGalleryVideos(newGallery);
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

  const removeGalleryVideo = (index: number) => {
    const newGallery = galleryVideos.filter((_, i) => i !== index);
    setGalleryVideos(newGallery);
    onChange(newGallery);
  };

  const handleRemoveSingle = () => {
    onThumbnail?.(null);
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
        accept={config.upload.acceptedVideoTypes.join(',')}
        onChange={handleChange}
        className={styles.hiddenInput}
        multiple={multiple}
      />
      <div className={styles.uploadContent}>
        <span className={styles.uploadIcon}>
          {isProcessing ? <LoaderCircle className={styles.spin} size={24} /> : <Clapperboard size={24} />}
        </span>
        <span className={styles.uploadTitle}>
          {isProcessing ? 'Читаем видео…' : 'Нажмите или перетащите видео'}
        </span>
        <span className={styles.uploadHint}>MP4, WebM, OGG, MOV до {maxSizeMb} МБ</span>
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
          {galleryVideos.length > 0 && (
            <div className={styles.galleryPreviewGrid}>
              {galleryVideos.map((video, index) => (
                <div key={index} className={styles.galleryPreviewItem}>
                  {/* preload="metadata": браузер читает только первый кадр, а не всё видео */}
                  <video src={video} className={styles.videoPreview} muted preload="metadata" />
                  <button
                    type="button"
                    className={styles.removeGalleryBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeGalleryVideo(index);
                    }}
                    aria-label={`Удалить видео ${index + 1}`}
                    title="Удалить"
                  >
                    <X size={14} />
                  </button>
                  {video.startsWith('data:') && <span className={styles.sizeBadge}>{formatDataUrlSize(video)}</span>}
                </div>
              ))}
            </div>
          )}
        </>
      ) : value && typeof value === 'string' ? (
        <div className={styles.previewContainer}>
          <video src={value} controls preload="metadata" className={styles.videoPreview} />
          <div className={styles.previewBar}>
            {/* у сохранённого видео в форме только адрес, размер известен лишь у нового файла */}
            <span className={styles.previewSize}>{value.startsWith('data:') ? formatDataUrlSize(value) : ''}</span>
            <button type="button" className={styles.previewRemove} onClick={handleRemoveSingle}>
              <Trash2 size={16} />
              Удалить
            </button>
          </div>
        </div>
      ) : (
        dropzone
      )}

      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};
