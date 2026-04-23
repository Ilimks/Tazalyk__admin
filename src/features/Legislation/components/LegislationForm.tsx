import React, { useState, useRef } from 'react';
import styles from '../LegislationManager.module.scss';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Form/Input';
import { useLegislationStore } from '@/store';
import type { Legislation } from '@/types';

interface LegislationFormProps {
    initialData?: Legislation;
    onSuccess: () => void;
    onCancel: () => void;
}

export const LegislationForm: React.FC<LegislationFormProps> = ({
    initialData,
    onSuccess,
    onCancel,
}) => {
    const { addItem, updateItem } = useLegislationStore();
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
        if (file) {
            processFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title) {
            alert('Введите название документа');
            return;
        }
        
        if (!formData.file_url && !initialData) {
            alert('Выберите файл');
            return;
        }

        setLoading(true);

        let success = false;
        if (initialData) {
            success = await updateItem(initialData.id, formData);
        } else {
            success = await addItem(formData);
        }

        if (success) {
            onSuccess();
        }
        setLoading(false);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <Input
                label="Название документа"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Введите название документа"
            />

            <div className={styles.fileUploadSection}>
                <label className={styles.fileUploadLabel}>
                    Файл документа {!initialData && <span className={styles.required}>*</span>}
                </label>
                
                {formData.file_url ? (
                    <div className={styles.filePreview}>
                        <div className={styles.filePreviewContent}>
                            <div className={styles.fileIcon}>📄</div>
                            <div className={styles.fileInfo}>
                                <div className={styles.fileName}>{formData.file_name}</div>
                                <div className={styles.fileSize}>{formatFileSize(formData.file_size)}</div>
                            </div>
                            <button
                                type="button"
                                className={styles.removeFileBtn}
                                onClick={() => setFormData({ ...formData, file_url: '', file_name: '', file_size: 0 })}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        className={`${styles.fileUploadArea} ${isDragging ? styles.dragging : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
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
                        <div className={styles.fileUploadContent}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                <path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke="currentColor" strokeWidth="2"/>
                                <polyline points="13 3 13 9 19 9" stroke="currentColor" strokeWidth="2"/>
                                <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="2"/>
                                <line x1="8" y1="17" x2="16" y2="17" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            <span className={styles.fileUploadTitle}>Нажмите или перетащите файл</span>
                            <span className={styles.fileUploadHint}>PDF, DOC, DOCX, XLS, XLSX, TXT до 10MB</span>
                        </div>
                    </div>
                )}
            </div>

            <Input
                label="Дата публикации"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
            />

            <div className={styles.formActions}>
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Отмена
                </Button>
                <Button type="submit" loading={loading}>
                    {initialData ? 'Сохранить' : 'Добавить'}
                </Button>
            </div>
        </form>
    );
};