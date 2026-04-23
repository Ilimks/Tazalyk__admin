import React, { useState } from 'react';
import styles from '../VideosManager.module.scss';
import { useVideosStore } from '@/store';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Form/Input';
import { VideoUpload } from '@/components/common/FileUpload/VideoUpload';
import type { Video } from '@/types';

interface VideoFormProps {
  initialData?: Video;
  onSuccess: () => void;
  onCancel: () => void;
}

export const VideoForm: React.FC<VideoFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const { addVideo, updateVideo } = useVideosStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: initialData?.id || Date.now().toString(), // Генерируем ID
    date: initialData?.date || new Date().toISOString().split('T')[0],
    main_video_url: initialData?.main_video_url || '',
    gallery_videos: initialData?.gallery_videos || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let success = false;
    if (initialData) {
      success = await updateVideo(initialData.id, formData);
    } else {
      success = await addVideo(formData);
    }

    if (success) {
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <VideoUpload
        label="Главное видео"
        value={formData.main_video_url}
        onChange={(url) => {
          if (typeof url === 'string') {
            setFormData({ ...formData, main_video_url: url });
          }
        }}
        required
      />

      <VideoUpload
        label="Дополнительные видео"
        value={formData.gallery_videos}
        onChange={(urls) => {
          if (Array.isArray(urls)) {
            setFormData({ ...formData, gallery_videos: urls });
          } else if (typeof urls === 'string' && urls) {
            setFormData({ ...formData, gallery_videos: [...formData.gallery_videos, urls] });
          }
        }}
        multiple
      />

      <Input
        label="Дата публикации"
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