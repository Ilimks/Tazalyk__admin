import { useState, useEffect, useRef } from 'react';
import styles from '../AdminPanel.module.scss';
import type { News } from '../types';
import { api } from '../../../api/api';

export const NewsManager: React.FC = () => {
    const [news, setNews] = useState<News[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNews, setEditingNews] = useState<News | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: ''
    });

    useEffect(() => {
        loadNews();
    }, []);

    const loadNews = async () => {
        try {
            setLoading(true);
            const data = await api.getNews();
            setNews(data);
        } catch (error) {
            console.error('Ошибка загрузки новостей:', error);
            setNews([]);
        } finally {
            setLoading(false);
        }
    };

    const uploadImage = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve(e.target?.result as string);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            
            setImageFile(file);
            
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setIsSaving(true);
        setUploadProgress(0);
        
        try {
            let imageUrl = editingNews?.image || '';
            
            if (imageFile) {
                setUploadProgress(30);
                imageUrl = await uploadImage(imageFile);
                setUploadProgress(70);
            }
            
            const newsData: News = {
                id: editingNews?.id || Date.now().toString(),
                title: formData.title,
                description: formData.description,
                image: imageUrl,
                date: formData.date,
                createdAt: editingNews?.createdAt || new Date().toISOString()
            };

            setUploadProgress(80);
            
            if (editingNews) {
                await api.updateNews(editingNews.id, newsData);
            } else {
                await api.createNews(newsData);
            }
            
            setUploadProgress(100);
            
            await loadNews();
            setIsModalOpen(false);
            resetForm();
            alert(editingNews ? '✅ Новость успешно обновлена!' : '✅ Новость успешно добавлена!');
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('❌ Ошибка при сохранении новости');
        } finally {
            setIsSaving(false);
            setUploadProgress(0);
        }
    };

    const resetForm = () => {
        setEditingNews(null);
        setFormData({ title: '', description: '', date: '' });
        setImageFile(null);
        setImagePreview('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleEdit = (item: News) => {
        setEditingNews(item);
        setFormData({
            title: item.title,
            description: item.description,
            date: item.date
        });
        setImagePreview(item.image);
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Вы уверены, что хотите удалить эту новость?')) {
            try {
                await api.deleteNews(id);
                await loadNews();
                alert('✅ Новость успешно удалена!');
            } catch (error) {
                console.error('Ошибка удаления:', error);
                alert('❌ Ошибка при удалении новости');
            }
        }
    };

    if (loading) {
        return (
            <div className={styles.manager}>
                <div className={styles.managerHeader}>
                    <h2>Управление новостями</h2>
                    <button className={styles.addBtn}>+ Добавить новость</button>
                </div>
                <div className={styles.tableWrapper}>
                    <div className={styles.loaderContainer}>
                        <div className={styles.loader}></div>
                        <p>Загрузка новостей...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.manager}>
            <div className={styles.managerHeader}>
                <h2>Управление новостями</h2>
                <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}>
                    + Добавить новость
                </button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            <th>Изображение</th>
                            <th>Название</th>
                            <th>Описание</th>
                            <th>Дата</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {news.map(item => (
                            <tr key={item.id}>
                                <td className={styles.imageCell}>
                                    {item.image && (
                                        <img 
                                            src={item.image} 
                                            alt={item.title} 
                                            className={styles.thumbnail}
                                        />
                                    )}
                                </td>
                                <td className={styles.titleCell}>{item.title}</td>
                                <td className={styles.descriptionCell}>{item.description}</td>
                                <td>{new Date(item.date).toLocaleDateString('ru-RU')}</td>
                                <td>
                                    <button onClick={() => handleEdit(item)} className={styles.editBtn}>
                                        ✏️
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className={styles.deleteBtn}>
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {news.length === 0 && (
                            <tr>
                                <td colSpan={5} className={styles.emptyCell}>
                                    Нет добавленных новостей
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3>{editingNews ? 'Редактировать новость' : 'Добавить новость'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.imageUploadSection}>
                                <label className={styles.imageUploadLabel}>
                                    <div className={styles.imageUploadArea}>
                                        {imagePreview ? (
                                            <div className={styles.imagePreview}>
                                                <img src={imagePreview} alt="Preview" />
                                                <button
                                                    type="button"
                                                    className={styles.removeImageBtn}
                                                    onClick={() => {
                                                        setImagePreview('');
                                                        setImageFile(null);
                                                        if (fileInputRef.current) {
                                                            fileInputRef.current.value = '';
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
                                                <span>Нажмите для выбора фото</span>
                                                <span className={styles.imageHint}>JPG, PNG, GIF до 5MB</span>
                                            </div>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className={styles.hiddenFileInput}
                                        />
                                    </div>
                                </label>
                            </div>

                            <input
                                type="text"
                                placeholder="Заголовок"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                            
                            <textarea
                                placeholder="Описание"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                required
                            />
                            
                            <input
                                type="date"
                                placeholder="Дата публикации"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                            
                            {isSaving && uploadProgress > 0 && (
                                <div className={styles.progressBar}>
                                    <div 
                                        className={styles.progressFill} 
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                    <span className={styles.progressText}>
                                        {uploadProgress < 100 ? 'Загрузка...' : 'Сохранение...'}
                                    </span>
                                </div>
                            )}
                            
                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        resetForm();
                                    }}
                                    className={styles.cancelBtn}
                                >
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