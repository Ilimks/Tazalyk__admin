import React, { useState, useRef } from 'react';
import { CloudUpload, FileText, Paperclip, X } from 'lucide-react';
import styles from '../LocalActsManager.module.scss';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Form/Input';
import { useLocalActsStore } from '@/store';
import type { LocalAct } from '@/types';

interface LocalActFormProps {
    initialData?: LocalAct;
    onSuccess: () => void;
    onCancel: () => void;
}

const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const LocalActForm: React.FC<LocalActFormProps> = ({
    initialData,
    onSuccess,
    onCancel,
}) => {
    const { addItem, updateItem } = useLocalActsStore();
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        file_url: initialData?.file_url || '',
        file_name: initialData?.file_name || '',
        file_size: initialData?.file_size || 0,
        date: initialData?.date || new Date().toISOString().split('T')[0],
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setFormData({
                ...formData,
                file_url: base64,
                file_name: file.name,
                file_size: file.size,
            });
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    // зона загрузки доступна и с клавиатуры (Enter / пробел)
    const handleDropzoneKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.file_url) {
            alert('Заполните все поля');
            return;
        }
        setLoading(true);
        let success = false;
        if (initialData) {
            success = await updateItem(initialData.id, formData);
        } else {
            success = await addItem(formData);
        }
        if (success) onSuccess();
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            {/* Сведения о документе */}
            <section className={styles.formSection}>
                <div className={styles.formSectionHead}>
                    <span className={styles.sectionIcon}>
                        <FileText size={16} />
                    </span>
                    <div className={styles.formSectionText}>
                        <h4 className={styles.formSectionTitle}>Сведения о документе</h4>
                        <p className={styles.formSectionHint}>Название и дата публикации на сайте</p>
                    </div>
                </div>

                <div className={styles.formGrid}>
                    <Input
                        className={styles.formGridFull}
                        label="Название документа"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        placeholder="Введите название документа"
                    />
                    <Input
                        label="Дата публикации"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                    />
                </div>
            </section>

            {/* Файл документа */}
            <section className={`${styles.formSection} ${styles.formSectionPadded}`}>
                <div className={styles.formSectionHead}>
                    <span className={styles.sectionIcon}>
                        <Paperclip size={16} />
                    </span>
                    <div className={styles.formSectionText}>
                        <h4 className={styles.formSectionTitle}>
                            Файл документа {!initialData && <span className={styles.required}>*</span>}
                        </h4>
                        <p className={styles.formSectionHint}>PDF, DOC, DOCX, XLS, XLSX или TXT</p>
                    </div>
                </div>

                {formData.file_url ? (
                    <div className={styles.filePreview}>
                        <span className={styles.fileIcon}>
                            <FileText size={20} />
                        </span>
                        <div className={styles.fileInfo}>
                            <div className={styles.fileName} title={formData.file_name}>{formData.file_name}</div>
                            <div className={styles.fileSize}>{formatFileSize(formData.file_size)}</div>
                        </div>
                        <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.danger}`}
                            onClick={() => setFormData({ ...formData, file_url: '', file_name: '', file_size: 0 })}
                            aria-label="Убрать файл"
                            title="Убрать файл"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <div
                        className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-label="Выбрать файл документа"
                        onKeyDown={handleDropzoneKeyDown}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                            onChange={handleFileChange}
                            className={styles.hiddenFileInput}
                        />
                        <span className={styles.dropzoneIcon}>
                            <CloudUpload size={22} />
                        </span>
                        <span className={styles.dropzoneTitle}>Нажмите или перетащите файл</span>
                        <span className={styles.dropzoneHint}>PDF, DOC, DOCX, XLS, XLSX, TXT до 10 МБ</span>
                    </div>
                )}
            </section>

            <div className={styles.formActions}>
                <Button type="button" variant="outline" onClick={onCancel}>Отмена</Button>
                <Button type="submit" loading={loading}>{initialData ? 'Сохранить' : 'Добавить'}</Button>
            </div>
        </form>
    );
};
