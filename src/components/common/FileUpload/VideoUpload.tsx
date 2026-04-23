import React, { useRef, useState } from 'react';
import styles from './FileUpload.module.scss';
import { Button } from '../Button';
import { config } from '@/config';

interface VideoUploadProps {
  value?: string | string[];
  onChange: (url: string | string[]) => void;
  onRemove?: () => void;
  label?: string;
  required?: boolean;
  multiple?: boolean;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  value,
  onChange,
  onRemove,
  label = 'Видео',
  required = false,
  multiple = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [galleryVideos, setGalleryVideos] = useState<string[]>(
    Array.isArray(value) ? value : []
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateVideoFile = (file: File): boolean => {
    if (!config.upload.acceptedVideoTypes.includes(file.type)) {
      alert('Пожалуйста, выберите видео файл (MP4, WebM, OGG, MOV)');
      return false;
    }
    if (file.size > config.upload.maxVideoSize) {
      alert(`Размер видео не должен превышать ${config.upload.maxVideoSize / (1024 * 1024)}MB`);
      return false;
    }
    return true;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    if (validateVideoFile(file)) {
      const base64 = await fileToBase64(file);
      if (multiple) {
        const newGallery = [...galleryVideos, base64];
        setGalleryVideos(newGallery);
        onChange(newGallery);
      } else {
        onChange(base64);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await handleFileSelect(file);
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (multiple) {
      for (const file of files) {
        await handleFileSelect(file);
      }
    } else if (files[0]) {
      await handleFileSelect(files[0]);
    }
    // Очищаем input, чтобы можно было загрузить тот же файл снова
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeGalleryVideo = (index: number) => {
    const newGallery = galleryVideos.filter((_, i) => i !== index);
    setGalleryVideos(newGallery);
    onChange(newGallery);
  };

  const handleRemoveSingle = () => {
    if (onRemove) {
      onRemove();
    } else {
      onChange('');
    }
  };

  // Для множественного выбора (галерея)
  if (multiple) {
    return (
      <div className={styles.uploadContainer}>
        {label && (
          <label className={styles.label}>
            {label} {required && <span className={styles.required}>*</span>}
          </label>
        )}

        <div
          className={`${styles.uploadArea} ${isDragging ? styles.dragging : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={config.upload.acceptedVideoTypes.join(',')}
            onChange={handleChange}
            className={styles.hiddenInput}
            multiple
          />
          <div className={styles.uploadContent}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
              <polygon points="10 8 16 12 10 16" fill="currentColor" />
            </svg>
            <span className={styles.uploadTitle}>Нажмите или перетащите видео</span>
            <span className={styles.uploadHint}>
              MP4, WebM, OGG, MOV до 100MB
            </span>
          </div>
        </div>

        {galleryVideos.length > 0 && (
          <div className={styles.galleryPreviewGrid}>
            {galleryVideos.map((video, index) => (
              <div key={index} className={styles.galleryPreviewItem}>
                <video src={video} className={styles.videoPreview} muted />
                <button
                  type="button"
                  className={styles.removeGalleryBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeGalleryVideo(index);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Для одиночного выбора
  return (
    <div className={styles.uploadContainer}>
      {label && (
        <label className={styles.label}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
      )}

      {value && typeof value === 'string' && value ? (
        <div className={styles.previewContainer}>
          <video src={value} controls className={styles.videoPreview} />
          <Button
            variant="danger"
            size="sm"
            onClick={handleRemoveSingle}
            className={styles.removeBtn}
          >
            Удалить
          </Button>
        </div>
      ) : (
        <div
          className={`${styles.uploadArea} ${isDragging ? styles.dragging : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={config.upload.acceptedVideoTypes.join(',')}
            onChange={handleChange}
            className={styles.hiddenInput}
          />
          <div className={styles.uploadContent}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
              <polygon points="10 8 16 12 10 16" fill="currentColor" />
            </svg>
            <span className={styles.uploadTitle}>Нажмите или перетащите видео</span>
            <span className={styles.uploadHint}>
              MP4, WebM, OGG, MOV до 100MB
            </span>
          </div>
        </div>
      )}
    </div>
  );
};