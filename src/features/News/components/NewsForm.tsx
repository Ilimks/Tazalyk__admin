import { splitSaveErrors } from '@/utils/apiErrors';
import React, { useId, useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import styles from '../NewsManager.module.scss';
import { useNewsStore } from '@/store';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Form/Input';
import { Textarea } from '@/components/common/Form/Textarea';
import { ImageUpload } from '@/components/common/FileUpload/ImageUpload';
import { FormError } from '@/components/common/FormError';
import type { News } from '@/types';
import { localToday } from '@/utils/date';

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
    const [errors, setErrors] = useState<{ title_ru?: string; description_ru?: string; form?: string }>({});
    const [showKyLanguage, setShowKyLanguage] = useState(!!initialData?.title_ky);
    const [formData, setFormData] = useState({
        title_ru: initialData?.title_ru || '',
        description_ru: initialData?.description_ru || '',
        title_ky: initialData?.title_ky || '',
        description_ky: initialData?.description_ky || '',
        date: initialData?.date || localToday(),
        image: initialData?.image || '',
    });
    const kySectionId = useId();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const problems: typeof errors = {};
        if (!formData.title_ru.trim()) problems.title_ru = 'Введите заголовок на русском';
        if (!formData.description_ru.trim()) problems.description_ru = 'Введите описание на русском';
        setErrors(problems);
        if (Object.keys(problems).length > 0) return;

        setLoading(true);

        const result = initialData ? await updateNews(initialData.id, formData) : await addNews(formData);

        if (result.success) {
            onSuccess();
        } else {
            const { fieldErrors, message } = splitSaveErrors(result, { title_ru: 'title_ru', description_ru: 'description_ru' });
            setErrors({ ...fieldErrors, form: message });
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <section className={styles.formSection}>
                <div className={styles.formSectionHead}>
                    <span className={styles.langBadge}>RU</span>
                    <div className={styles.formSectionText}>
                        <h4 className={styles.formSectionTitle}>
                            Русский язык
                        </h4>
                        <p className={styles.formSectionHint}>Основная версия новости, обязательна для публикации</p>
                    </div>
                </div>
                <Input
                    label="Заголовок"
                    value={formData.title_ru}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title_ru: e.target.value }))}
                    error={errors.title_ru}
                    required
                    placeholder="Введите заголовок на русском"
                />
                <Textarea
                    label="Описание"
                    value={formData.description_ru}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description_ru: e.target.value }))}
                    error={errors.description_ru}
                    required
                    placeholder="Введите описание на русском"
                    rows={5}
                />
            </section>

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
                            onChange={(e) => setFormData((prev) => ({ ...prev, title_ky: e.target.value }))}
                            placeholder="Кыргызча аталыш"
                        />
                        <Textarea
                            label="Описание"
                            value={formData.description_ky}
                            onChange={(e) => setFormData((prev) => ({ ...prev, description_ky: e.target.value }))}
                            placeholder="Кыргызча сүрөттөмө"
                            rows={5}
                        />
                    </div>
                )}
            </section>

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
                        onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                        required
                    />

                    <div className={styles.formGridFull}>
                        <ImageUpload
                            section="news"
                            label="Изображение"
                            value={formData.image}
                            onChange={(url) => {
                                if (typeof url === 'string') {
                                    setFormData((prev) => ({ ...prev, image: url }));
                                }
                            }}
                            required
                        />
                    </div>
                </div>

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
