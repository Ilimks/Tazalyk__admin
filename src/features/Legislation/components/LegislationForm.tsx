import React from 'react';
import { DocumentForm } from '@/components/common/DocumentForm';
import { useLegislationStore } from '@/store';
import type { Legislation } from '@/types';

interface LegislationFormProps {
  initialData?: Legislation;
  onSuccess: () => void;
  onCancel: () => void;
}

export const LegislationForm: React.FC<LegislationFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const { addItem, updateItem } = useLegislationStore();
  return (
    <DocumentForm
      section="legislation"
      hint="Название нормативного акта и дата публикации на сайте"
      initialData={initialData}
      save={(data) => (initialData ? updateItem(initialData.id, data) : addItem(data))}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
};
