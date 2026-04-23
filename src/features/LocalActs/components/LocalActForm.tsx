import React, { useState, useRef } from 'react';
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
            <Input label="Название документа" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required placeholder="Введите название документа" />
            
            <div className={styles.fileUploadSection}>
                <label className={styles.fileUploadLabel}>Файл документа {!initialData && <span className={styles.required}>*</span>}</label>
                {formData.file_url ? (
                    <div className={styles.filePreview}>
                        <div className={styles.filePreviewContent}>
                            <div className={styles.fileIcon}>📄</div>
                            <div className={styles.fileInfo}><div className={styles.fileName}>{formData.file_name}</div><div className={styles.fileSize}>{(formData.file_size / 1024).toFixed(2)} KB</div></div>
                            <button type="button" className={styles.removeFileBtn} onClick={() => setFormData({ ...formData, file_url: '', file_name: '', file_size: 0 })}>×</button>
                        </div>
                    </div>
                ) : (
                    <div className={`${styles.fileUploadArea} ${isDragging ? styles.dragging : ''}`} onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={handleFileChange} className={styles.hiddenFileInput} />
                        <div className={styles.fileUploadContent}><span className={styles.fileUploadTitle}>Нажмите или перетащите файл</span><span className={styles.fileUploadHint}>PDF, DOC, DOCX, XLS, XLSX, TXT до 10MB</span></div>
                    </div>
                )}
            </div>

            <Input label="Дата публикации" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />

            <div className={styles.formActions}><Button type="button" variant="secondary" onClick={onCancel}>Отмена</Button><Button type="submit" loading={loading}>{initialData ? 'Сохранить' : 'Добавить'}</Button></div>
        </form>
    );
};