// src/features/News/components/NewsForm.tsx
import React, { useState } from 'react';
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
            {/* Языковые вкладки */}
            <div className={styles.languageTabs}>
                <div className={styles.langTabActive}>
                    🇷🇺 Русский (основной) <span className={styles.required}>*</span>
                </div>
                <button 
                    type="button" 
                    className={styles.langTab}
                    onClick={() => setShowKyLanguage(!showKyLanguage)}
                >
                    🇰🇬 Кыргызча {showKyLanguage ? '▼' : '▶'}
                </button>
            </div>

            {/* Русский язык (обязательный) */}
            <div className={styles.languageSection}>
                <Input
                    label="Заголовок (Русский)"
                    value={formData.title_ru}
                    onChange={(e) => setFormData({ ...formData, title_ru: e.target.value })}
                    required
                    placeholder="Введите заголовок на русском"
                />
                <Textarea
                    label="Описание (Русский)"
                    value={formData.description_ru}
                    onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
                    required
                    placeholder="Введите описание на русском"
                    rows={5}
                />
            </div>

            {/* Кыргызский язык (опциональный) */}
            {showKyLanguage && (
                <div className={`${styles.languageSection} ${styles.kyLanguage}`}>
                    <div className={styles.sectionHeader}>
                        <span>🇰🇬 Кыргызча (кошумча)</span>
                    </div>
                    <Input
                        label="Заголовок (Кыргызча)"
                        value={formData.title_ky}
                        onChange={(e) => setFormData({ ...formData, title_ky: e.target.value })}
                        placeholder="Кыргызча аталыш"
                    />
                    <Textarea
                        label="Описание (Кыргызча)"
                        value={formData.description_ky}
                        onChange={(e) => setFormData({ ...formData, description_ky: e.target.value })}
                        placeholder="Кыргызча сүрөттөмө"
                        rows={5}
                    />
                </div>
            )}

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

            <Input
                label="Дата публикации"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
            />

            {uploadProgress > 0 && uploadProgress < 100 && (
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
                    <span className={styles.progressText}>Загрузка: {uploadProgress}%</span>
                </div>
            )}

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