import { useState, useEffect, useRef } from 'react';
import styles from '../AdminPanel.module.scss';
import type { Photo } from '../types';
import { api } from '../../../api/api';

export const PhotosManager: React.FC = () => {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [mainImageFile, setMainImageFile] = useState<File | null>(null);
    const [mainImagePreview, setMainImagePreview] = useState<string>('');
    const [galleryImages, setGalleryImages] = useState<(File | string)[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const mainImageInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: ''
    });

    useEffect(() => {
        loadPhotos();
    }, []);

    const loadPhotos = async () => {
        try {
            const data = await api.getPhotos();
            setPhotos(data);
        } catch (error) {
            console.error('Ошибка загрузки фото:', error);
            setPhotos([]);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Пожалуйста, выберите изображение');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('Размер изображения не должен превышать 5MB');
                return;
            }
            
            setMainImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setMainImagePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                alert(`Файл ${file.name} не является изображением`);
                return false;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert(`Файл ${file.name} превышает 5MB`);
                return false;
            }
            return true;
        });

        setGalleryImages([...galleryImages, ...validFiles]);
        
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setGalleryPreviews(prev => [...prev, e.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeGalleryImage = (index: number) => {
        setGalleryImages(prev => prev.filter((_, i) => i !== index));
        setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const resetForm = () => {
        setEditingPhoto(null);
        setFormData({ title: '', description: '', date: '' });
        setMainImageFile(null);
        setMainImagePreview('');
        setGalleryImages([]);
        setGalleryPreviews([]);
        if (mainImageInputRef.current) mainImageInputRef.current.value = '';
        if (galleryInputRef.current) galleryInputRef.current.value = '';
    };

    const handleCancel = () => {
        resetForm();
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!mainImageFile && !editingPhoto?.main_image) {
            alert('Пожалуйста, выберите главное изображение');
            return;
        }
        
        setIsSaving(true);
        setUploadProgress(0);
        
        try {
            let mainImageUrl = editingPhoto?.main_image || '';
            let galleryImagesUrls: string[] = editingPhoto?.gallery_images || [];
            
            if (mainImageFile) {
                setUploadProgress(20);
                mainImageUrl = await fileToBase64(mainImageFile);
                setUploadProgress(40);
            }
            
            if (galleryImages.length > 0) {
                setUploadProgress(50);
                const newImages = await Promise.all(
                    galleryImages.map(async (img) => {
                        if (img instanceof File) {
                            return await fileToBase64(img);
                        }
                        return img as string;
                    })
                );
                galleryImagesUrls = [...galleryImagesUrls, ...newImages];
                setUploadProgress(70);
            }
            
            const photoData: Photo = {
                id: editingPhoto?.id || Date.now().toString(),
                title: formData.title,
                description: formData.description,
                main_image: mainImageUrl,
                gallery_images: galleryImagesUrls,
                date: formData.date,
                created_at: editingPhoto?.created_at || new Date().toISOString()
            };

            setUploadProgress(80);
            
            if (editingPhoto) {
                await api.updatePhoto(editingPhoto.id, photoData);
            } else {
                await api.createPhoto(photoData);
            }
            
            setUploadProgress(100);
            
            await loadPhotos();
            setIsModalOpen(false);
            resetForm();
            alert(editingPhoto ? '✅ Фото успешно обновлено!' : '✅ Фото успешно добавлено!');
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('❌ Ошибка при сохранении');
        } finally {
            setIsSaving(false);
            setUploadProgress(0);
        }
    };

    const handleEdit = (photo: Photo) => {
        setEditingPhoto(photo);
        setFormData({
            title: photo.title,
            description: photo.description,
            date: photo.date
        });
        setMainImagePreview(photo.main_image);
        setGalleryPreviews(photo.gallery_images);
        setGalleryImages(photo.gallery_images);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Вы уверены, что хотите удалить это фото?')) {
            try {
                await api.deletePhoto(id);
                await loadPhotos();
                alert('✅ Фото успешно удалено!');
            } catch (error) {
                console.error('Ошибка удаления:', error);
                alert('❌ Ошибка при удалении');
            }
        }
    };

    return (
        <div className={styles.manager}>
            <div className={styles.managerHeader}>
                <h2>Управление фото</h2>
                <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}>
                    + Добавить фото
                </button>
            </div>

            <div className={styles.photosGrid}>
                {photos.map(photo => (
                    <div key={photo.id} className={styles.photoCard}>
                        <div className={styles.photoImage}>
                            <img src={photo.main_image} alt={photo.title} />
                            {photo.gallery_images?.length > 0 && (
                                <div className={styles.galleryCount}>
                                    +{photo.gallery_images.length}
                                </div>
                            )}
                        </div>
                        <div className={styles.photoInfo}>
                            <h4>{photo.title}</h4>
                            <p>{photo.description}</p>
                            <span className={styles.photoDate}>
                                {new Date(photo.date).toLocaleDateString('ru-RU')}
                            </span>
                        </div>
                        <div className={styles.photoActions}>
                            <button onClick={() => handleEdit(photo)} className={styles.editBtn}>
                                ✏️
                            </button>
                            <button onClick={() => handleDelete(photo.id)} className={styles.deleteBtn}>
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
                {photos.length === 0 && (
                    <div className={styles.emptyGrid}>
                        <p>Нет добавленных фото</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3>{editingPhoto ? 'Редактировать фото' : 'Добавить фото'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.imageUploadSection}>
                                <label className={styles.imageUploadLabel}>
                                    <div className={styles.imageUploadArea}>
                                        {mainImagePreview ? (
                                            <div className={styles.imagePreview}>
                                                <img src={mainImagePreview} alt="Главное фото" />
                                                <button
                                                    type="button"
                                                    className={styles.removeImageBtn}
                                                    onClick={() => {
                                                        setMainImagePreview('');
                                                        setMainImageFile(null);
                                                        if (mainImageInputRef.current) {
                                                            mainImageInputRef.current.value = '';
                                                        }
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={styles.imagePlaceholder}>
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                                    <rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
                                                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                                                    <path d="M21 15l-5-4-3 3-4-4-5 5" stroke="currentColor" strokeWidth="2"/>
                                                </svg>
                                                <span>Главное фото</span>
                                                <span className={styles.imageHint}>Обязательное поле</span>
                                            </div>
                                        )}
                                        <input
                                            ref={mainImageInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleMainImageChange}
                                            className={styles.hiddenFileInput}
                                        />
                                    </div>
                                </label>
                            </div>

                            <div className={styles.galleryUploadSection}>
                                <label className={styles.galleryUploadLabel}>
                                    <div className={styles.galleryUploadArea}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2"/>
                                            <rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
                                        </svg>
                                        <span>Дополнительные фото</span>
                                        <span className={styles.imageHint}>Можно выбрать несколько</span>
                                        <input
                                            ref={galleryInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleGalleryImagesChange}
                                            className={styles.hiddenFileInput}
                                        />
                                    </div>
                                </label>
                                
                                {galleryPreviews.length > 0 && (
                                    <div className={styles.galleryPreviewGrid}>
                                        {galleryPreviews.map((preview, index) => (
                                            <div key={index} className={styles.galleryPreviewItem}>
                                                <img src={preview} alt={`Галерея ${index + 1}`} />
                                                <button
                                                    type="button"
                                                    className={styles.removeGalleryBtn}
                                                    onClick={() => removeGalleryImage(index)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <input
                                type="text"
                                placeholder="Название"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                            
                            <textarea
                                placeholder="Описание"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                            
                            <input
                                type="date"
                                placeholder="Дата"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                            
                            {isSaving && uploadProgress > 0 && (
                                <div className={styles.progressBar}>
                                    <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }}>
                                        <span className={styles.progressText}>
                                            {uploadProgress < 100 ? 'Загрузка...' : 'Сохранение...'}
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                                </button>
                                <button type="button" onClick={handleCancel} className={styles.cancelBtn}>
                                    Отмена
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};