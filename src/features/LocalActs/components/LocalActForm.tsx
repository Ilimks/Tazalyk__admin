import React from 'react';
import { DocumentForm } from '@/components/common/DocumentForm';
import { useLocalActsStore } from '@/store';
import type { LocalAct } from '@/types';

interface LocalActFormProps {
  initialData?: LocalAct;
  onSuccess: () => void;
  onCancel: () => void;
}

export const LocalActForm: React.FC<LocalActFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const { addItem, updateItem } = useLocalActsStore();
  return (
    <DocumentForm
      section="local_acts"
      hint="Название и дата публикации на сайте"
      initialData={initialData}
      save={(data) => (initialData ? updateItem(initialData.id, data) : addItem(data))}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
};
