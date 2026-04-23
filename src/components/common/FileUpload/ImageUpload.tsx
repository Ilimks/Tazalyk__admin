import React, { useRef, useState } from 'react';
import styles from './FileUpload.module.scss';
import { Button } from '../Button';
import { config } from '@/config';

interface ImageUploadProps {
  value?: string | string[];
  onChange: (url: string | string[]) => void;
  onRemove?: () => void;
  label?: string;
  required?: boolean;
  multiple?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onRemove,
  label = 'Изображение',
  required = false,
  multiple = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>(
    Array.isArray(value) ? value : []
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (!config.upload.acceptedImageTypes.includes(file.type)) {
      alert('Пожалуйста, выберите изображение (JPG, PNG, GIF, WebP)');
      return false;
    }
    if (file.size > config.upload.maxImageSize) {
      alert(`Размер изображения не должен превышать ${config.upload.maxImageSize / (1024 * 1024)}MB`);
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
    if (validateFile(file)) {
      const base64 = await fileToBase64(file);
      if (multiple) {
        const newGallery = [...galleryImages, base64];
        setGalleryImages(newGallery);
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

  const removeGalleryImage = (index: number) => {
    const newGallery = galleryImages.filter((_, i) => i !== index);
    setGalleryImages(newGallery);
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
            accept={config.upload.acceptedImageTypes.join(',')}
            onChange={handleChange}
            className={styles.hiddenInput}
            multiple
          />
          <div className={styles.uploadContent}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
              <path d="M21 15l-5-4-3 3-4-4-5 5" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className={styles.uploadTitle}>Нажмите или перетащите фото</span>
            <span className={styles.uploadHint}>
              {config.upload.acceptedImageTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} до {config.upload.maxImageSize / (1024 * 1024)}MB
            </span>
          </div>
        </div>

        {galleryImages.length > 0 && (
          <div className={styles.galleryPreviewGrid}>
            {galleryImages.map((img, index) => (
              <div key={index} className={styles.galleryPreviewItem}>
                <img src={img} alt={`Gallery ${index + 1}`} />
                <button
                  type="button"
                  className={styles.removeGalleryBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeGalleryImage(index);
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
          <img src={value} alt="Preview" className={styles.preview} />
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
            accept={config.upload.acceptedImageTypes.join(',')}
            onChange={handleChange}
            className={styles.hiddenInput}
          />
          <div className={styles.uploadContent}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
              <path d="M21 15l-5-4-3 3-4-4-5 5" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className={styles.uploadTitle}>Нажмите или перетащите файл</span>
            <span className={styles.uploadHint}>
              {config.upload.acceptedImageTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} до {config.upload.maxImageSize / (1024 * 1024)}MB
            </span>
          </div>
        </div>
      )}
    </div>
  );
};