import React, { useState } from 'react';
import { Banknote, Building, FilePenLine, Hash, SlidersHorizontal } from 'lucide-react';
import styles from '../ProcurementsManager.module.scss';
import { useProcurementsStore } from '@/store';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Form';
import { Select } from '@/components/common/Form';
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
  const [formData, setFormData] = useState({
    contractNumber: initialData?.contractNumber || '',
    supplier: initialData?.supplier || '',
    type: initialData?.type || 'goods',
    method: initialData?.method || 'direct',
    status: initialData?.status || 'active',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    amount: initialData?.amount?.toString() || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const amountNumber = parseFloat(formData.amount.replace(/\s/g, ''));
    if (isNaN(amountNumber) || amountNumber <= 0) {
      alert('Введите корректную сумму');
      setLoading(false);
      return;
    }

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
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
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
            required
            placeholder="Введите номер контракта"
            icon={<Hash />}
          />

          <Input
            label="Сумма договора"
            type="text"
            inputMode="decimal"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
            placeholder="Введите сумму в сомах"
            icon={<Banknote />}
          />

          <Input
            className={styles.formGridFull}
            label="Поставщик"
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
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
            required
          />
        </div>
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
