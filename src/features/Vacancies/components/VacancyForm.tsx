import React, { useState } from 'react';
import { BriefcaseBusiness, Eye, ListChecks } from 'lucide-react';
import styles from '../VacanciesManager.module.scss';
import { useVacanciesStore } from '@/store';
import { useNotificationStore } from '@/store/notification.store';
import { Button } from '@/components/common/Button';
import { Input, Textarea } from '@/components/common/Form';
import type { Vacancy, VacancyInput } from '@/types';

interface VacancyFormProps {
  initialData?: Vacancy;
  onSuccess: (vacancy: Vacancy) => void;
  onCancel: () => void;
}

type FormState = Omit<VacancyInput, 'salary_from' | 'salary_to'> & {
  // как введено в поле: «30 000» или пусто
  salary_from: string;
  salary_to: string;
};

const MAX_SALARY = 10_000_000;

// поля, у которых форма сама показывает ошибку сервера
const FORM_FIELDS = new Set([
  'title_ru', 'title_ky', 'description_ru', 'description_ky', 'requirements_ru', 'requirements_ky',
  'schedule_ru', 'schedule_ky', 'salary_from', 'salary_to',
]);

// «30 000» → 30000, пусто → null, не число → NaN
const parseSalary = (raw: string): number | null => {
  const value = raw.replace(/\s/g, '');
  if (!value) return null;
  return /^\d+$/.test(value) ? Number(value) : NaN;
};

const toFormState = (vacancy?: Vacancy): FormState => ({
  title_ru: vacancy?.title_ru || '',
  title_ky: vacancy?.title_ky || '',
  description_ru: vacancy?.description_ru || '',
  description_ky: vacancy?.description_ky || '',
  requirements_ru: vacancy?.requirements_ru || '',
  requirements_ky: vacancy?.requirements_ky || '',
  schedule_ru: vacancy?.schedule_ru || '',
  schedule_ky: vacancy?.schedule_ky || '',
  salary_from: vacancy?.salary_from != null ? String(vacancy.salary_from) : '',
  salary_to: vacancy?.salary_to != null ? String(vacancy.salary_to) : '',
  is_active: vacancy?.is_active ?? true,
});

const validate = (data: FormState): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!data.title_ru.trim()) errors.title_ru = 'Введите название должности';

  const from = parseSalary(data.salary_from);
  const to = parseSalary(data.salary_to);
  const salaryError = 'Целое число сомов, например 30000';
  if (Number.isNaN(from) || (from !== null && from > MAX_SALARY)) errors.salary_from = salaryError;
  if (Number.isNaN(to) || (to !== null && to > MAX_SALARY)) errors.salary_to = salaryError;
  if (!errors.salary_from && !errors.salary_to && from !== null && to !== null && to < from) {
    errors.salary_to = 'Не может быть меньше зарплаты «от»';
  }
  return errors;
};

export const VacancyForm: React.FC<VacancyFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const { addVacancy, updateVacancy } = useVacanciesStore();
  const { showNotification } = useNotificationStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormState>(() => toFormState(initialData));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const problems = validate(formData);
    if (Object.keys(problems).length > 0) {
      setErrors(problems);
      return;
    }

    const payload: VacancyInput = {
      title_ru: formData.title_ru.trim(),
      title_ky: formData.title_ky.trim(),
      description_ru: formData.description_ru.trim(),
      description_ky: formData.description_ky.trim(),
      requirements_ru: formData.requirements_ru.trim(),
      requirements_ky: formData.requirements_ky.trim(),
      schedule_ru: formData.schedule_ru.trim(),
      schedule_ky: formData.schedule_ky.trim(),
      salary_from: parseSalary(formData.salary_from),
      salary_to: parseSalary(formData.salary_to),
      is_active: formData.is_active,
    };

    setLoading(true);
    const result = initialData ? await updateVacancy(initialData.id, payload) : await addVacancy(payload);
    setLoading(false);

    if (result.success && result.data) {
      onSuccess(result.data);
      return;
    }

    const entries = Object.entries(result.fieldErrors || {});
    setErrors(Object.fromEntries(entries.filter(([field]) => FORM_FIELDS.has(field))));
    const otherErrors = entries.filter(([field]) => !FORM_FIELDS.has(field)).map(([, text]) => text);
    showNotification([result.message, ...otherErrors].filter(Boolean).join(' '), 'error');
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {/* Должность, зарплата, график */}
      <section className={styles.formSection}>
        <div className={styles.formSectionHead}>
          <span className={styles.sectionIcon}>
            <BriefcaseBusiness size={16} />
          </span>
          <div className={styles.formSectionText}>
            <h4 className={styles.formSectionTitle}>Должность</h4>
            <p className={styles.formSectionHint}>Обязательно только название на русском. Без зарплаты на сайте будет «по договорённости»</p>
          </div>
        </div>

        <div className={styles.formGrid}>
          <Input
            label="Должность на русском"
            value={formData.title_ru}
            onChange={(e) => setField('title_ru', e.target.value)}
            error={errors.title_ru}
            required
            maxLength={200}
            placeholder="Например, Водитель мусоровоза"
          />
          <Input
            label="Должность на кыргызском"
            value={formData.title_ky}
            onChange={(e) => setField('title_ky', e.target.value)}
            error={errors.title_ky}
            maxLength={200}
            placeholder="Кыргызча аталышы"
          />
          <Input
            label="Зарплата от, сом"
            inputMode="numeric"
            value={formData.salary_from}
            onChange={(e) => setField('salary_from', e.target.value)}
            error={errors.salary_from}
            placeholder="30000"
          />
          <Input
            label="Зарплата до, сом"
            inputMode="numeric"
            value={formData.salary_to}
            onChange={(e) => setField('salary_to', e.target.value)}
            error={errors.salary_to}
            placeholder="40000"
          />
          <Input
            label="График работы на русском"
            value={formData.schedule_ru}
            onChange={(e) => setField('schedule_ru', e.target.value)}
            error={errors.schedule_ru}
            maxLength={200}
            placeholder="Пн–Пт, 8:00–17:00"
          />
          <Input
            label="График работы на кыргызском"
            value={formData.schedule_ky}
            onChange={(e) => setField('schedule_ky', e.target.value)}
            error={errors.schedule_ky}
            maxLength={200}
            placeholder="Дш–Жм, 8:00–17:00"
          />
        </div>
      </section>

      {/* Обязанности и требования на двух языках */}
      <section className={styles.formSection}>
        <div className={styles.formSectionHead}>
          <span className={styles.sectionIcon}>
            <ListChecks size={16} />
          </span>
          <div className={styles.formSectionText}>
            <h4 className={styles.formSectionTitle}>Описание</h4>
            <p className={styles.formSectionHint}>Необязательно. Каждое требование пишите с новой строки — на сайте это будет список</p>
          </div>
        </div>

        <div className={styles.formGrid}>
          <Textarea
            label="Обязанности и условия на русском"
            value={formData.description_ru}
            onChange={(e) => setField('description_ru', e.target.value)}
            error={errors.description_ru}
            rows={4}
            placeholder="Чем предстоит заниматься, что предлагаем"
          />
          <Textarea
            label="Обязанности и условия на кыргызском"
            value={formData.description_ky}
            onChange={(e) => setField('description_ky', e.target.value)}
            error={errors.description_ky}
            rows={4}
            placeholder="Кыргызча сүрөттөмө"
          />
          <Textarea
            label="Требования на русском"
            value={formData.requirements_ru}
            onChange={(e) => setField('requirements_ru', e.target.value)}
            error={errors.requirements_ru}
            rows={4}
            placeholder={'Права категории C\nСтаж от 2 лет'}
          />
          <Textarea
            label="Требования на кыргызском"
            value={formData.requirements_ky}
            onChange={(e) => setField('requirements_ky', e.target.value)}
            error={errors.requirements_ky}
            rows={4}
            placeholder={'C категориясындагы күбөлүк\n2 жылдан ашык тажрыйба'}
          />
        </div>
      </section>

      {/* Публикация */}
      <section className={styles.formSection}>
        <div className={styles.formSectionHead}>
          <span className={styles.sectionIcon}>
            <Eye size={16} />
          </span>
          <div className={styles.formSectionText}>
            <h4 className={styles.formSectionTitle}>Публикация</h4>
            <p className={styles.formSectionHint}>Включить и отключить вакансию можно и прямо в списке</p>
          </div>
        </div>

        <label className={`${styles.checkRow} ${formData.is_active ? styles.checkRowOn : ''}`}>
          <input type="checkbox" checked={formData.is_active} onChange={(e) => setField('is_active', e.target.checked)} />
          <span className={styles.checkText}>
            <span className={styles.checkTitle}>Активна — показывать на сайте</span>
            <span className={styles.checkHint}>Снимите отметку, чтобы скрыть вакансию, не удаляя её</span>
          </span>
        </label>
      </section>

      <div className={styles.formActions}>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Отмена
        </Button>
        <Button type="submit" loading={loading}>
          {initialData ? 'Сохранить' : 'Добавить'}
        </Button>
      </div>
    </form>
  );
};
