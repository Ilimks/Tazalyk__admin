import React, { useState } from 'react';
import { CalendarDays, Camera, Captions } from 'lucide-react';
import styles from '../PhotosManager.module.scss';
import { usePhotosStore } from '@/store';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Form/Input';
import { ImageUpload } from '@/components/common/FileUpload/ImageUpload';
import { FormError } from '@/components/common/FormError';
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
  const [errors, setErrors] = useState<{ image?: string; date?: string; form?: string }>({});
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    main_image: initialData?.main_image || '',
    caption_ru: initialData?.caption_ru || '',
    caption_ky: initialData?.caption_ky || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const problems: typeof errors = {};
    if (!formData.main_image) problems.image = 'Выберите фото';
    if (!formData.date) problems.date = 'Укажите дату публикации';
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setLoading(true);

    let success = false;
    if (initialData) {
      success = await updatePhoto(initialData.id, formData);
    } else {
      success = await addPhoto(formData);
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
      {/* одна запись — одно фото: дополнительных фото у записи больше нет */}
      <section className={styles.formSection}>
        <div className={styles.formSectionHead}>
          <span className={styles.sectionIcon}>
            <Camera size={16} />
          </span>
          <div className={styles.formSectionText}>
            <h4 className={styles.formSectionTitle}>Фото</h4>
            <p className={styles.formSectionHint}>Показывается в разделе «Медиа» на сайте</p>
          </div>
        </div>
        <ImageUpload
          label="Фото"
          value={formData.main_image}
          onChange={(url) => {
            if (typeof url === 'string') {
              setFormData({ ...formData, main_image: url });
              if (url) setErrors((prev) => ({ ...prev, image: undefined }));
            }
          }}
          required
        />
        {errors.image && <span className={styles.fieldError} role="alert">{errors.image}</span>}
      </section>

      <section className={styles.formSection}>
        <div className={styles.formSectionHead}>
          <span className={styles.sectionIcon}>
            <Captions size={16} />
          </span>
          <div className={styles.formSectionText}>
            <h4 className={styles.formSectionTitle}>Подпись</h4>
            <p className={styles.formSectionHint}>Необязательно: что на фото. Видна на сайте и в списке</p>
          </div>
        </div>
        <Input
          label="На русском"
          value={formData.caption_ru}
          onChange={(e) => setFormData((prev) => ({ ...prev, caption_ru: e.target.value }))}
          placeholder="Например: субботник на бульваре Эркиндик"
          maxLength={160}
        />
        <Input
          label="На кыргызском"
          value={formData.caption_ky}
          onChange={(e) => setFormData((prev) => ({ ...prev, caption_ky: e.target.value }))}
          placeholder="Мисалы: Эркиндик бульварындагы ишембилик"
          maxLength={160}
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
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
