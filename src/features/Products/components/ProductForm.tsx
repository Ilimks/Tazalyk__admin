import React, { useState } from 'react';
import { Camera, Eye, FileText, Package, RotateCcw } from 'lucide-react';
import styles from '../ProductsManager.module.scss';
import { useProductsStore } from '@/store';
import { useNotificationStore } from '@/store/notification.store';
import { Button } from '@/components/common/Button';
import { Input, Select, Textarea } from '@/components/common/Form';
import { ImageUpload } from '@/components/common/FileUpload/ImageUpload';
import { MATERIAL_OPTIONS } from '../materials';
import type { Product, ProductInput, ProductMaterial } from '@/types';

interface ProductFormProps {
  initialData?: Product;
  onSuccess: (product: Product) => void;
  onCancel: () => void;
}

type FormState = {
  name_ru: string;
  name_ky: string;
  description_ru: string;
  description_ky: string;
  volume: string;
  material: ProductMaterial | '';
  price: string;
  // ссылка на текущее фото, data URL нового или '' — без фото
  image: string;
  in_stock: boolean;
  is_featured: boolean;
  is_active: boolean;
  sort_order: string;
};

// поля, у которых форма сама показывает ошибку сервера
const FORM_FIELDS = new Set([
  'name_ru', 'name_ky', 'description_ru', 'description_ky',
  'volume', 'material', 'price', 'image', 'sort_order',
]);

// «3 500,50» → «3500.50»; null — не число
const parsePrice = (raw: string): string | null => {
  const value = raw.replace(/\s/g, '').replace(',', '.');
  return /^\d+(\.\d{1,2})?$/.test(value) ? value : null;
};

const toFormState = (product?: Product): FormState => ({
  name_ru: product?.name_ru || '',
  name_ky: product?.name_ky || '',
  description_ru: product?.description_ru || '',
  description_ky: product?.description_ky || '',
  volume: product ? String(product.volume) : '',
  material: product?.material || '',
  // "3500.00" → "3500"
  price: product ? String(Number(product.price)) : '',
  image: product?.image || '',
  in_stock: product?.in_stock ?? true,
  is_featured: product?.is_featured ?? false,
  is_active: product?.is_active ?? true,
  sort_order: String(product?.sort_order ?? 0),
});

const validate = (data: FormState): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!data.name_ru.trim()) errors.name_ru = 'Введите название товара';
  const volume = Number(data.volume);
  if (!data.volume || !Number.isInteger(volume) || volume < 1) errors.volume = 'Объём — целое число литров, от 1';
  if (!data.material) errors.material = 'Выберите материал';
  if (parsePrice(data.price) === null) errors.price = 'Цена — число от 0, например 3500';
  if (!/^-?\d+$/.test(data.sort_order.trim())) errors.sort_order = 'Целое число, например 0';
  // ImageUpload пропускает GIF без пересжатия, а сервер принимает только JPEG, PNG и WebP
  if (data.image.startsWith('data:image/gif')) errors.image = 'GIF не подходит — выберите JPEG, PNG или WebP';
  return errors;
};

export const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const { addProduct, updateProduct } = useProductsStore();
  const { showNotification } = useNotificationStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormState>(() => toFormState(initialData));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const initialImage = initialData?.image || '';

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

    const payload: ProductInput = {
      name_ru: formData.name_ru.trim(),
      name_ky: formData.name_ky.trim(),
      description_ru: formData.description_ru.trim(),
      description_ky: formData.description_ky.trim(),
      volume: Number(formData.volume),
      material: formData.material as ProductMaterial,
      price: parsePrice(formData.price) as string,
      in_stock: formData.in_stock,
      is_featured: formData.is_featured,
      is_active: formData.is_active,
      sort_order: Number(formData.sort_order),
    };
    // фото отправляем, только если его сменили ('' — удалить); иначе сервер оставит прежнее
    if (formData.image !== initialImage) payload.image = formData.image;

    setLoading(true);
    const result = initialData ? await updateProduct(initialData.id, payload) : await addProduct(payload);
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

  const checkboxes: { field: 'in_stock' | 'is_featured' | 'is_active'; title: string; hint: string }[] = [
    { field: 'in_stock', title: 'В наличии', hint: 'Без отметки товар виден на сайте, но заказать его нельзя' },
    { field: 'is_featured', title: 'Показывать на главной (до 4 товаров)', hint: 'Попадает в подборку магазина на главной странице' },
    { field: 'is_active', title: 'Опубликован на сайте', hint: 'Снимите отметку, чтобы временно скрыть товар, не удаляя его' },
  ];

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {/* Основное: название, объём, материал, цена */}
      <section className={styles.formSection}>
        <div className={styles.formSectionHead}>
          <span className={styles.sectionIcon}>
            <Package size={16} />
          </span>
          <div className={styles.formSectionText}>
            <h4 className={styles.formSectionTitle}>Основное</h4>
            <p className={styles.formSectionHint}>Название на русском, объём, материал и цена обязательны</p>
          </div>
        </div>

        <div className={styles.formGrid}>
          <Input
            label="Название на русском"
            value={formData.name_ru}
            onChange={(e) => setField('name_ru', e.target.value)}
            error={errors.name_ru}
            required
            maxLength={200}
            placeholder="Например, Контейнер 240 л с крышкой"
          />
          <Input
            label="Название на кыргызском"
            value={formData.name_ky}
            onChange={(e) => setField('name_ky', e.target.value)}
            error={errors.name_ky}
            maxLength={200}
            placeholder="Кыргызча аталышы"
          />
        </div>

        <div className={`${styles.formGrid} ${styles.formGrid3}`}>
          <Input
            label="Объём, литры"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={formData.volume}
            onChange={(e) => setField('volume', e.target.value)}
            error={errors.volume}
            required
            placeholder="240"
          />
          <Select
            label="Материал"
            value={formData.material}
            onChange={(e) => setField('material', e.target.value as ProductMaterial)}
            options={MATERIAL_OPTIONS}
            placeholder="Выберите материал"
            error={errors.material}
            required
          />
          <Input
            label="Цена, сом"
            type="text"
            inputMode="decimal"
            value={formData.price}
            onChange={(e) => setField('price', e.target.value)}
            error={errors.price}
            required
            placeholder="3500"
          />
        </div>
      </section>

      {/* Описание на двух языках */}
      <section className={styles.formSection}>
        <div className={styles.formSectionHead}>
          <span className={styles.sectionIcon}>
            <FileText size={16} />
          </span>
          <div className={styles.formSectionText}>
            <h4 className={styles.formSectionTitle}>Описание</h4>
            <p className={styles.formSectionHint}>Необязательно: размеры, цвет, комплектация</p>
          </div>
        </div>

        <Textarea
          label="Описание на русском"
          value={formData.description_ru}
          onChange={(e) => setField('description_ru', e.target.value)}
          error={errors.description_ru}
          rows={4}
          placeholder="Коротко о товаре"
        />
        <Textarea
          label="Описание на кыргызском"
          value={formData.description_ky}
          onChange={(e) => setField('description_ky', e.target.value)}
          error={errors.description_ky}
          rows={4}
          placeholder="Кыргызча сүрөттөмө"
        />
      </section>

      {/* Фото */}
      <section className={styles.formSection}>
        <div className={styles.formSectionHead}>
          <span className={styles.sectionIcon}>
            <Camera size={16} />
          </span>
          <div className={styles.formSectionText}>
            <h4 className={styles.formSectionTitle}>Фото</h4>
            <p className={styles.formSectionHint}>JPEG, PNG или WebP — большое фото уменьшится автоматически</p>
          </div>
        </div>

        <ImageUpload
          label="Фото товара"
          value={formData.image}
          onChange={(url) => {
            if (typeof url === 'string') setField('image', url);
          }}
        />
        {errors.image && <span className={styles.fieldError}>{errors.image}</span>}
        {initialImage && formData.image !== initialImage && (
          <button type="button" className={styles.restoreImage} onClick={() => setField('image', initialImage)}>
            <RotateCcw size={14} />
            Вернуть прежнее фото
          </button>
        )}
      </section>

      {/* Публикация */}
      <section className={styles.formSection}>
        <div className={styles.formSectionHead}>
          <span className={styles.sectionIcon}>
            <Eye size={16} />
          </span>
          <div className={styles.formSectionText}>
            <h4 className={styles.formSectionTitle}>Публикация</h4>
            <p className={styles.formSectionHint}>Наличие, показ на сайте и место в каталоге</p>
          </div>
        </div>

        <div className={styles.checkList}>
          {checkboxes.map(({ field, title, hint }) => (
            <label key={field} className={`${styles.checkRow} ${formData[field] ? styles.checkRowOn : ''}`}>
              <input type="checkbox" checked={formData[field]} onChange={(e) => setField(field, e.target.checked)} />
              <span className={styles.checkText}>
                <span className={styles.checkTitle}>{title}</span>
                <span className={styles.checkHint}>{hint}</span>
              </span>
            </label>
          ))}
        </div>

        <Input
          className={styles.sortField}
          label="Порядок (меньше — выше)"
          type="number"
          inputMode="numeric"
          step={1}
          value={formData.sort_order}
          onChange={(e) => setField('sort_order', e.target.value)}
          error={errors.sort_order}
          placeholder="0"
        />
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
