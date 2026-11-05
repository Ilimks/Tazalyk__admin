// src/features/News/components/NewsForm.tsx
import React, { useId, useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import styles from '../NewsManager.module.scss';
import { useNewsStore } from '@/store';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Form/Input';
import { Textarea } from '@/components/common/Form/Textarea';
import { ImageUpload } from '@/components/common/FileUpload/ImageUpload';
import type { News } from '@/types';

interface NewsFormProps {
    initialData?: News;
    onSuccess: () => void;
    onCancel: () => void;
}

export const NewsForm: React.FC<NewsFormProps> = ({
    initialData,
    onSuccess,
    onCancel,
}) => {
    const { addNews, updateNews } = useNewsStore();
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showKyLanguage, setShowKyLanguage] = useState(!!initialData?.title_ky);
    const [formData, setFormData] = useState({
        title_ru: initialData?.title_ru || '',
        description_ru: initialData?.description_ru || '',
        title_ky: initialData?.title_ky || '',
        description_ky: initialData?.description_ky || '',
        date: initialData?.date || new Date().toISOString().split('T')[0],
        image: initialData?.image || '',
    });
    const kySectionId = useId();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title_ru || !formData.description_ru) {
            alert('Заполните обязательные поля (Русский язык)');
            return;
        }

        setLoading(true);
        setUploadProgress(0);

        let success = false;
        if (initialData) {
            success = await updateNews(initialData.id, formData);
        } else {
            success = await addNews(formData);
        }

        if (success) {
            onSuccess();
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            {/* Русский язык (обязательный) */}
            <section className={styles.formSection}>
                <div className={styles.formSectionHead}>
                    <span className={styles.langBadge}>RU</span>
                    <div className={styles.formSectionText}>
                        <h4 className={styles.formSectionTitle}>
                            Русский язык <span className={styles.required}>*</span>
                        </h4>
                        <p className={styles.formSectionHint}>Основная версия новости, обязательна для публикации</p>
                    </div>
                </div>
                <Input
                    label="Заголовок"
                    value={formData.title_ru}
                    onChange={(e) => setFormData({ ...formData, title_ru: e.target.value })}
                    required
                    placeholder="Введите заголовок на русском"
                />
                <Textarea
                    label="Описание"
                    value={formData.description_ru}
                    onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
                    required
                    placeholder="Введите описание на русском"
                    rows={5}
                />
            </section>

            {/* Кыргызский язык (опциональный, раскрывается по кнопке) */}
            <section className={`${styles.formSection} ${styles.formSectionCollapsible}`}>
                <button
                    type="button"
                    className={styles.formSectionToggle}
                    onClick={() => setShowKyLanguage(!showKyLanguage)}
                    aria-expanded={showKyLanguage}
                    aria-controls={kySectionId}
                >
                    <span className={`${styles.langBadge} ${styles.langBadgeKy}`}>KY</span>
                    <span className={styles.formSectionText}>
                        <span className={styles.formSectionTitle}>Кыргызча</span>
                        <span className={styles.formSectionHint}>Необязательно: перевод для кыргызской версии сайта</span>
                    </span>
                    <ChevronDown size={18} className={styles.toggleChevron} />
                </button>

                {showKyLanguage && (
                    <div id={kySectionId} className={styles.formSectionBody}>
                        <Input
                            label="Заголовок"
                            value={formData.title_ky}
                            onChange={(e) => setFormData({ ...formData, title_ky: e.target.value })}
                            placeholder="Кыргызча аталыш"
                        />
                        <Textarea
                            label="Описание"
                            value={formData.description_ky}
                            onChange={(e) => setFormData({ ...formData, description_ky: e.target.value })}
                            placeholder="Кыргызча сүрөттөмө"
                            rows={5}
                        />
                    </div>
                )}
            </section>

            {/* Публикация: дата и обложка */}
            <section className={styles.formSection}>
                <div className={styles.formSectionHead}>
                    <span className={styles.sectionIcon}>
                        <CalendarDays size={16} />
                    </span>
                    <div className={styles.formSectionText}>
                        <h4 className={styles.formSectionTitle}>Публикация</h4>
                        <p className={styles.formSectionHint}>Дата на сайте и обложка новости</p>
                    </div>
                </div>

                <div className={styles.formGrid}>
                    <Input
                        label="Дата публикации"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                    />

                    <div className={styles.formGridFull}>
                        <ImageUpload
                            label="Изображение"
                            value={formData.image}
                            onChange={(url) => {
                                if (typeof url === 'string') {
                                    setFormData({ ...formData, image: url });
                                    setUploadProgress(50);
                                    setTimeout(() => setUploadProgress(100), 500);
                                }
                            }}
                            required
                        />
                    </div>
                </div>

                {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className={styles.progressBar} role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}>
                        <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
                        <span className={styles.progressText}>Загрузка: {uploadProgress}%</span>
                    </div>
                )}
            </section>

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
