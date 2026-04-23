import React, { useState } from 'react';
import styles from '../PhotosManager.module.scss';
import { usePhotosStore } from '@/store';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Form/Input';
import { ImageUpload } from '@/components/common/FileUpload/ImageUpload';
import type { Photo } from '@/types';

interface PhotoFormProps {
  initialData?: Photo;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PhotoForm: React.FC<PhotoFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const { addPhoto, updatePhoto } = usePhotosStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    main_image: initialData?.main_image || '',
    gallery_images: initialData?.gallery_images || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let success = false;
    if (initialData) {
      success = await updatePhoto(initialData.id, formData);
    } else {
      success = await addPhoto(formData);
    }

    if (success) {
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <ImageUpload
        label="Главное фото"
        value={formData.main_image}
        onChange={(url) => {
          if (typeof url === 'string') {
            setFormData({ ...formData, main_image: url });
          }
        }}
        required
      />

      <ImageUpload
        label="Дополнительные фото"
        value={formData.gallery_images}
        onChange={(urls) => {
          if (Array.isArray(urls)) {
            setFormData({ ...formData, gallery_images: urls });
          } else if (typeof urls === 'string' && urls) {
            setFormData({ ...formData, gallery_images: [...formData.gallery_images, urls] });
          }
        }}
        multiple
      />

      <Input
        label="Дата"
        type="date"
        value={formData.date}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        required
      />

      <div className={styles.formActions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" loading={loading}>
          {initialData ? 'Сохранить' : 'Добавить'}
        </Button>
      </div>
    </form>
  );
};