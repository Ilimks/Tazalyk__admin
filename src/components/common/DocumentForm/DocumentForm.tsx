import React, { useEffect, useRef, useState } from 'react';
import { CloudUpload, FileText, Paperclip, X } from 'lucide-react';
import styles from './DocumentForm.module.scss';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Form/Input';
import { FormError } from '@/components/common/FormError';
import { UploadProgress } from '@/components/common/UploadProgress';
import { checkFile, formatLimit, loadUploadLimit, uploadFile, type UploadLimit } from '@/api/uploads';
import type { Document, SaveResult } from '@/types';
import { localToday } from '@/utils/date';
import { splitSaveErrors } from '@/utils/apiErrors';
import { formatters } from '@/utils/formatters';

export type DocumentInput = Pick<Document, 'title' | 'file_url' | 'file_name' | 'file_size' | 'date'>;

type Field = keyof DocumentInput | 'form';

const FIELDS = { title: 'title', file_url: 'file_url', file_name: 'file_url', file_size: 'file_url', date: 'date' };

interface DocumentFormProps {
  section: 'local_acts' | 'legislation';
  hint: string;
  initialData?: Document;
  save: (data: DocumentInput) => Promise<SaveResult>;
  onSuccess: () => void;
  onCancel: () => void;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({ section, hint, initialData, save, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<DocumentInput>({
    title: initialData?.title || '',
    file_url: initialData?.file_url || '',
    file_name: initialData?.file_name || '',
    file_size: initialData?.file_size || 0,
    date: initialData?.date || localToday(),
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [limit, setLimit] = useState<UploadLimit>();
  const [progress, setProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUploadLimit('document').then(setLimit);
  }, []);

  const update = (patch: Partial<DocumentInput>) => setFormData((prev) => ({ ...prev, ...patch }));

  const processFile = async (file: File) => {
    const problem = checkFile(file, await loadUploadLimit('document'));
    if (problem) {
      setErrors((prev) => ({ ...prev, file_url: problem }));
      return;
    }
    setErrors((prev) => ({ ...prev, file_url: undefined }));
    setProgress(0);
    try {
      const { url, size } = await uploadFile(file, { section, kind: 'document', name: file.name, onProgress: setProgress });
      update({ file_url: url, file_name: file.name, file_size: size });
    } catch (error) {
      setErrors((prev) => ({ ...prev, file_url: (error as Error).message }));
    } finally {
      setProgress(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (progress !== null) return;

    const problems: Partial<Record<Field, string>> = {};
    if (!formData.title.trim()) problems.title = 'Введите название документа';
    if (!formData.date) problems.date = 'Укажите дату публикации';
    if (!formData.file_url) problems.file_url = 'Выберите файл документа';
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setLoading(true);
    const result = await save({ ...formData, title: formData.title.trim() });
    setLoading(false);
    if (result.success) {
      onSuccess();
      return;
    }
    const { fieldErrors, message } = splitSaveErrors(result, FIELDS);
    setErrors({ ...fieldErrors, form: message });
  };

  const typesHint = 'PDF, DOC, DOCX, XLS, XLSX или TXT';
  const sizeHint = limit ? `до ${formatLimit(limit)}` : '';

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <section className={styles.formSection}>
        <div className={styles.formSectionHead}>
          <span className={styles.sectionIcon}>
            <FileText size={16} />
          </span>
          <div className={styles.formSectionText}>
            <h4 className={styles.formSectionTitle}>Сведения о документе</h4>
            <p className={styles.formSectionHint}>{hint}</p>
          </div>
        </div>

        <div className={styles.formGrid}>
          <Input
            className={styles.formGridFull}
            label="Название документа"
            value={formData.title}
            onChange={(e) => update({ title: e.target.value })}
            error={errors.title}
            required
            placeholder="Введите название документа"
          />
          <Input
            label="Дата публикации"
            type="date"
            value={formData.date}
            onChange={(e) => update({ date: e.target.value })}
            error={errors.date}
            required
          />
        </div>
      </section>

      <section className={`${styles.formSection} ${styles.formSectionPadded}`}>
        <div className={styles.formSectionHead}>
          <span className={styles.sectionIcon}>
            <Paperclip size={16} />
          </span>
          <div className={styles.formSectionText}>
            <h4 className={styles.formSectionTitle}>
              Файл документа <span className={styles.required}>*</span>
            </h4>
            <p className={styles.formSectionHint}>{typesHint}</p>
          </div>
        </div>

        {formData.file_url ? (
          <div className={styles.filePreview}>
            <span className={styles.fileIcon}>
              <FileText size={20} />
            </span>
            <div className={styles.fileInfo}>
              <div className={styles.fileName} title={formData.file_name}>{formData.file_name}</div>
              <div className={styles.fileSize}>{formatters.fileSize(formData.file_size)}</div>
            </div>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Заменить файл"
              title="Заменить файл"
            >
              <CloudUpload size={16} />
            </button>
            {!initialData && (
              <button
                type="button"
                className={`${styles.iconBtn} ${styles.danger}`}
                onClick={() => update({ file_url: '', file_name: '', file_size: 0 })}
                aria-label="Убрать файл"
                title="Убрать файл"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ) : (
          <div
            className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${errors.file_url ? styles.dropzoneError : ''}`}
            role="button"
            tabIndex={0}
            aria-label="Выбрать файл документа"
            aria-disabled={progress !== null}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files[0];
              if (file && progress === null) processFile(file);
            }}
            onClick={() => progress === null && fileInputRef.current?.click()}
          >
            <span className={styles.dropzoneIcon}>
              <CloudUpload size={22} />
            </span>
            <span className={styles.dropzoneTitle}>Нажмите или перетащите файл</span>
            <span className={styles.dropzoneHint}>{[typesHint, sizeHint].filter(Boolean).join(' ')}</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
            e.target.value = '';
          }}
          className={styles.hiddenFileInput}
        />
        {progress !== null && <UploadProgress ratio={progress} label="Загрузка файла" />}
        {errors.file_url && (
          <span className={styles.fieldError} role="alert">{errors.file_url}</span>
        )}
      </section>

      <FormError message={errors.form} />

      <div className={styles.formActions}>
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" loading={loading} disabled={progress !== null}>
          {initialData ? 'Сохранить' : 'Добавить'}
        </Button>
      </div>
    </form>
  );
};
