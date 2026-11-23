import React, { useEffect, useState } from 'react';
import { CalendarDays, Clapperboard, ImageOff } from 'lucide-react';
import styles from '../VideosManager.module.scss';
import { useVideosStore } from '@/store';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Form/Input';
import { VideoUpload } from '@/components/common/FileUpload/VideoUpload';
import { FormError } from '@/components/common/FormError';
import { captureVideoThumbnail } from '@/utils/media';
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
  const [errors, setErrors] = useState<{ video?: string; date?: string; form?: string }>({});
  const [formData, setFormData] = useState({
    id: initialData?.id || Date.now().toString(),
    date: initialData?.date || new Date().toISOString().split('T')[0],
    main_video_url: initialData?.main_video_url || '',
    gallery_videos: initialData?.gallery_videos || [],
    thumbnail: initialData?.thumbnail || '',
  });

  // у старых видео нет превью — снимаем кадр из уже загруженного ролика,
  // и оно сохранится вместе с видео
  useEffect(() => {
    if (!initialData || initialData.thumbnail || !initialData.main_video_url) return;
    let cancelled = false;
    captureVideoThumbnail(initialData.main_video_url).then((thumb) => {
      if (!cancelled && thumb) {
        setFormData((prev) => (prev.thumbnail ? prev : { ...prev, thumbnail: thumb }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const problems: typeof errors = {};
    if (!formData.main_video_url) problems.video = 'Выберите видео';
    if (!formData.date) problems.date = 'Укажите дату публикации';
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setLoading(true);

    let success = false;
    if (initialData) {
      success = await updateVideo(initialData.id, formData);
    } else {
      success = await addVideo(formData);
    }

    if (success) {
      onSuccess();
    } else {
      setErrors({ form: 'Не удалось сохранить. Проверьте поля и связь с сервером и попробуйте ещё раз.' });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <section className={styles.formSection}>
        <div className={styles.formSectionHead}>
          <span className={styles.sectionIcon}>
            <Clapperboard size={16} />
          </span>
          <div className={styles.formSectionText}>
            <h4 className={styles.formSectionTitle}>Видео</h4>
            <p className={styles.formSectionHint}>Показывается в разделе «Медиа» на сайте</p>
          </div>
        </div>
        <VideoUpload
          label="Главное видео"
          value={formData.main_video_url}
          onChange={(url) => {
            if (typeof url === 'string') {
              setFormData((prev) => ({ ...prev, main_video_url: url }));
              if (url) setErrors((prev) => ({ ...prev, video: undefined }));
            }
          }}
          onThumbnail={(thumbnail) => setFormData((prev) => ({ ...prev, thumbnail: thumbnail || '' }))}
          required
        />
        {errors.video && <span className={styles.fieldError} role="alert">{errors.video}</span>}

        <div className={styles.thumbnailField}>
          <span className={styles.thumbnailLabel}>Превью для сайта</span>
          {formData.thumbnail ? (
            <img src={formData.thumbnail} alt="Кадр-превью видео" className={styles.thumbnailImage} />
          ) : (
            <span className={styles.thumbnailPlaceholder}>
              <ImageOff size={18} />
              Появится автоматически после выбора видео
            </span>
          )}
          <span className={styles.thumbnailHint}>
            На сайте сначала показывается эта картинка, а само видео загружается только по нажатию.
          </span>
        </div>

        <VideoUpload
          label="Дополнительные видео"
          value={formData.gallery_videos}
          onChange={(urls) => {
            if (Array.isArray(urls)) {
              setFormData((prev) => ({ ...prev, gallery_videos: urls }));
            } else if (typeof urls === 'string' && urls) {
              setFormData((prev) => ({ ...prev, gallery_videos: [...prev.gallery_videos, urls] }));
            }
          }}
          multiple
        />
      </section>

      <section className={styles.formSection}>
        <div className={styles.formSectionHead}>
          <span className={styles.sectionIcon}>
            <CalendarDays size={16} />
          </span>
          <div className={styles.formSectionText}>
            <h4 className={styles.formSectionTitle}>Публикация</h4>
            <p className={styles.formSectionHint}>Дата публикации на сайте</p>
          </div>
        </div>
        <Input
          className={styles.formRow}
          label="Дата публикации"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
          error={errors.date}
          required
        />
      </section>

      <FormError message={errors.form} />

      <div className={styles.formActions}>
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" loading={loading}>
          {initialData ? 'Сохранить' : 'Добавить'}
        </Button>
      </div>
    </form>
  );
};
