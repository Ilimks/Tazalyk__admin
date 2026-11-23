import React, { useState } from 'react';
import { Banknote, Building, FilePenLine, Hash, SlidersHorizontal } from 'lucide-react';
import styles from '../ProcurementsManager.module.scss';
import { useProcurementsStore } from '@/store';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Form';
import { Select } from '@/components/common/Form';
import { FormError } from '@/components/common/FormError';
import { formatters } from '@/utils/formatters';
import type { Procurement } from '@/types';

interface ProcurementFormProps {
  initialData?: Procurement;
  onSuccess: () => void;
  onCancel: () => void;
}

const typeOptions = [
  { value: 'goods', label: 'Товар' },
  { value: 'services', label: 'Услуга' },
  { value: 'works', label: 'Работа' },
];

const methodOptions = [
  { value: 'direct', label: 'Прямое заключение договора' },
  { value: 'quotation', label: 'Запрос котировок' },
  { value: 'simple', label: 'Простейшая закупка' },
  { value: 'tender', label: 'Конкурс' },
];

const statusOptions = [
  { value: 'active', label: 'Активна' },
  { value: 'completed', label: 'Завершена' },
  { value: 'cancelled', label: 'Отменена' },
];

export const ProcurementForm: React.FC<ProcurementFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const { addProcurement, updateProcurement } = useProcurementsStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ contractNumber?: string; supplier?: string; amount?: string; date?: string; form?: string }>({});
  const [formData, setFormData] = useState({
    contractNumber: initialData?.contractNumber || '',
    supplier: initialData?.supplier || '',
    type: initialData?.type || 'goods',
    method: initialData?.method || 'direct',
    status: initialData?.status || 'active',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    // сервер отдаёт «12450000.00» — в поле показываем как в таблице: «12 450 000»
    amount: initialData?.amount ? formatters.amount(initialData.amount).replace(/\u00a0/g, ' ') : '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountNumber = parseFloat(formData.amount.replace(/\s/g, '').replace(',', '.'));
    const problems: typeof errors = {};
    if (!formData.contractNumber.trim()) problems.contractNumber = 'Введите номер контракта';
    if (!formData.supplier.trim()) problems.supplier = 'Введите название поставщика';
    if (isNaN(amountNumber) || amountNumber <= 0) problems.amount = 'Сумма — число больше нуля, например 860 000';
    if (!formData.date) problems.date = 'Укажите дату';
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setLoading(true);

    const procurementData = {
      ...formData,
      amount: amountNumber,
    };

    let success = false;
    if (initialData) {
      success = await updateProcurement(initialData.id, procurementData);
    } else {
      success = await addProcurement(procurementData);
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
      {/* Контракт: номер, поставщик, сумма */}
      <section className={styles.formSection}>
        <div className={styles.formSectionHead}>
          <span className={styles.sectionIcon}>
            <FilePenLine size={16} />
          </span>
          <div className={styles.formSectionText}>
            <h4 className={styles.formSectionTitle}>Контракт</h4>
            <p className={styles.formSectionHint}>Номер договора, поставщик и сумма</p>
          </div>
        </div>

        <div className={styles.formGrid}>
          <Input
            label="Номер контракта"
            value={formData.contractNumber}
            onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
            error={errors.contractNumber}
            required
            placeholder="Введите номер контракта"
            icon={<Hash />}
          />

          <Input
            label="Сумма договора, сом"
            type="text"
            inputMode="decimal"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            error={errors.amount}
            required
            placeholder="Например, 860 000"
            icon={<Banknote />}
          />

          <Input
            className={styles.formGridFull}
            label="Поставщик"
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            error={errors.supplier}
            required
            placeholder="Введите название поставщика"
            icon={<Building />}
          />
        </div>
      </section>

      {/* Параметры закупки: короткие поля в две колонки */}
      <section className={styles.formSection}>
        <div className={styles.formSectionHead}>
          <span className={styles.sectionIcon}>
            <SlidersHorizontal size={16} />
          </span>
          <div className={styles.formSectionText}>
            <h4 className={styles.formSectionTitle}>Параметры закупки</h4>
            <p className={styles.formSectionHint}>Тип, способ, статус и дата</p>
          </div>
        </div>

        <div className={styles.formGrid}>
          <Select
            label="Тип закупки"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as Procurement['type'] })}
            options={typeOptions}
            required
          />

          <Select
            label="Способ закупки"
            value={formData.method}
            onChange={(e) => setFormData({ ...formData, method: e.target.value as Procurement['method'] })}
            options={methodOptions}
            required
          />

          <Select
            label="Статус"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Procurement['status'] })}
            options={statusOptions}
            required
          />

          <Input
            label="Дата"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            error={errors.date}
            required
          />
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
