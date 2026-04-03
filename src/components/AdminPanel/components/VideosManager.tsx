import { useState, useEffect, useRef } from 'react';
import styles from '../AdminPanel.module.scss';
import type { Video } from '../types';
import { api } from '../../../api/api';

export const VideosManager: React.FC = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVideo, setEditingVideo] = useState<Video | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [mainVideoFile, setMainVideoFile] = useState<File | null>(null);
    const [mainVideoPreview, setMainVideoPreview] = useState<string>('');
    const [galleryVideos, setGalleryVideos] = useState<File[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const mainVideoInputRef = useRef<HTMLInputElement>(null);
    const galleryVideoInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        title: '',
        date: ''
    });

    useEffect(() => {
        loadVideos();
    }, []);

    const loadVideos = async () => {
        try {
            setLoading(true);
            const data = await api.getVideos();
            setVideos(data);
        } catch (error) {
            console.error('Ошибка загрузки видео:', error);
            setVideos([]);
        } finally {
            setLoading(false);
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

    const validateVideoFile = (file: File): boolean => {
        const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
        if (!validTypes.includes(file.type)) {
            alert('Пожалуйста, выберите видео файл (MP4, WebM, OGG, MOV)');
            return false;
        }
        if (file.size > 100 * 1024 * 1024) {
            alert('Размер видео не должен превышать 100MB');
            return false;
        }
        return true;
    };

    const handleMainVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && validateVideoFile(file)) {
            setMainVideoFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setMainVideoPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleGalleryVideosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(file => validateVideoFile(file));

        setGalleryVideos([...galleryVideos, ...validFiles]);
        
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setGalleryPreviews(prev => [...prev, e.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeGalleryVideo = (index: number) => {
        setGalleryVideos(prev => prev.filter((_, i) => i !== index));
        setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const resetForm = () => {
        setEditingVideo(null);
        setFormData({ title: '', date: '' });
        setMainVideoFile(null);
        setMainVideoPreview('');
        setGalleryVideos([]);
        setGalleryPreviews([]);
        if (mainVideoInputRef.current) mainVideoInputRef.current.value = '';
        if (galleryVideoInputRef.current) galleryVideoInputRef.current.value = '';
    };

    const handleCancel = () => {
        resetForm();
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!mainVideoFile && !editingVideo?.main_video_url) {
            alert('Пожалуйста, выберите главное видео');
            return;
        }
        
        setIsSaving(true);
        setUploadProgress(0);
        
        try {
            let mainVideoUrl = editingVideo?.main_video_url || '';
            let galleryVideosUrls: string[] = editingVideo?.gallery_videos || [];
            
            if (mainVideoFile) {
                setUploadProgress(30);
                mainVideoUrl = await fileToBase64(mainVideoFile);
                setUploadProgress(50);
            }
            
            if (galleryVideos.length > 0) {
                setUploadProgress(60);
                const newVideos = await Promise.all(
                    galleryVideos.map(async (video) => {
                        return await fileToBase64(video);
                    })
                );
                galleryVideosUrls = [...galleryVideosUrls, ...newVideos];
                setUploadProgress(80);
            }
            
            const videoData: Video = {
                id: editingVideo?.id || Date.now().toString(),
                title: formData.title,
                description: '',
                main_video_url: mainVideoUrl,
                gallery_videos: galleryVideosUrls,
                date: formData.date,
                created_at: editingVideo?.created_at || new Date().toISOString()
            };

            setUploadProgress(90);
            
            if (editingVideo) {
                await api.updateVideo(editingVideo.id, videoData);
            } else {
                await api.createVideo(videoData);
            }
            
            setUploadProgress(100);
            
            await loadVideos();
            setIsModalOpen(false);
            resetForm();
            alert(editingVideo ? '✅ Видео успешно обновлено!' : '✅ Видео успешно добавлено!');
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('❌ Ошибка при сохранении видео');
        } finally {
            setIsSaving(false);
            setUploadProgress(0);
        }
    };

    const handleEdit = (video: Video) => {
        setEditingVideo(video);
        setFormData({
            title: video.title,
            date: video.date
        });
        setMainVideoPreview(video.main_video_url);
        setGalleryPreviews(video.gallery_videos || []);
        setGalleryVideos([]);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Вы уверены, что хотите удалить это видео?')) {
            try {
                await api.deleteVideo(id);
                await loadVideos();
                alert('✅ Видео успешно удалено!');
            } catch (error) {
                console.error('Ошибка удаления:', error);
                alert('❌ Ошибка при удалении видео');
            }
        }
    };

    if (loading) {
        return (
            <div className={styles.manager}>
                <div className={styles.managerHeader}>
                    <h2>Управление видео</h2>
                    <button className={styles.addBtn}>+ Добавить видео</button>
                </div>
                <div className={styles.loaderContainer}>
                    <div className={styles.loader}></div>
                    <p>Загрузка видео...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.manager}>
            <div className={styles.managerHeader}>
                <h2>Управление видео</h2>
                <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}>
                    + Добавить видео
                </button>
            </div>

            <div className={styles.videosGrid}>
                {videos.map(video => (
                    <div key={video.id} className={styles.videoCard}>
                        <div className={styles.videoThumbnail}>
                            <video 
                                src={video.main_video_url} 
                                className={styles.videoPreviewElement}
                                muted
                            />
                            <div className={styles.videoOverlay}>
                                <span>▶</span>
                            </div>
                            {video.gallery_videos?.length > 0 && (
                                <div className={styles.galleryCount}>
                                    +{video.gallery_videos.length}
                                </div>
                            )}
                        </div>
                        <div className={styles.videoInfo}>
                            <h4>{video.title}</h4>
                            <span className={styles.videoDate}>
                                {new Date(video.date).toLocaleDateString('ru-RU')}
                            </span>
                        </div>
                        <div className={styles.videoActions}>
                            <button onClick={() => handleEdit(video)} className={styles.editBtn}>
                                ✏️
                            </button>
                            <button onClick={() => handleDelete(video.id)} className={styles.deleteBtn}>
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
                {videos.length === 0 && (
                    <div className={styles.emptyGrid}>
                        <p>Нет добавленных видео</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3>{editingVideo ? 'Редактировать видео' : 'Добавить видео'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>
                                    <span className={styles.required}>*</span> Название видео
                                </label>
                                <input
                                    type="text"
                                    placeholder="Введите название видео"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>
                                    <span className={styles.required}>*</span> Главное видео
                                </label>
                                <div 
                                    className={styles.videoUploadBox}
                                    onClick={() => mainVideoInputRef.current?.click()}
                                >
                                    <input
                                        ref={mainVideoInputRef}
                                        type="file"
                                        accept="video/*"
                                        onChange={handleMainVideoChange}
                                        className={styles.hiddenFileInput}
                                    />
                                    {mainVideoPreview ? (
                                        <div className={styles.videoUploadPreview}>
                                            <video 
                                                src={mainVideoPreview} 
                                                className={styles.previewVideo}
                                                controls
                                            />
                                            <button
                                                type="button"
                                                className={styles.removeVideoBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMainVideoPreview('');
                                                    setMainVideoFile(null);
                                                    if (mainVideoInputRef.current) {
                                                        mainVideoInputRef.current.value = '';
                                                    }
                                                }}
                                            >
                                                ×
                                            </button>
                                            <div className={styles.videoInfoBadge}>
                                                <span>✓ Видео выбрано</span>
                                                <span className={styles.videoSize}>
                                                    {mainVideoFile && (mainVideoFile.size / (1024 * 1024)).toFixed(1)} MB
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={styles.videoUploadPlaceholder}>
                                            <div className={styles.uploadIcon}>
                                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                                                    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                                                    <polygon points="10 8 16 12 10 16" fill="currentColor"/>
                                                </svg>
                                            </div>
                                            <div className={styles.uploadText}>
                                                <span className={styles.uploadTitle}>Нажмите для выбора видео</span>
                                                <span className={styles.uploadHint}>MP4, WebM, OGG, MOV до 100MB</span>
                                            </div>
                                            <div className={styles.uploadArrow}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2"/>
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Дополнительные видео</label>
                                <div 
                                    className={styles.galleryUploadBox}
                                    onClick={() => galleryVideoInputRef.current?.click()}
                                >
                                    <input
                                        ref={galleryVideoInputRef}
                                        type="file"
                                        accept="video/*"
                                        multiple
                                        onChange={handleGalleryVideosChange}
                                        className={styles.hiddenFileInput}
                                    />
                                    {galleryPreviews.length > 0 ? (
                                        <>
                                            <div className={styles.galleryPreviewGrid}>
                                                {galleryPreviews.map((preview, index) => (
                                                    <div key={index} className={styles.galleryPreviewItem}>
                                                        <video 
                                                            src={preview} 
                                                            className={styles.galleryVideoPreview}
                                                            muted
                                                        />
                                                        <div className={styles.videoDurationBadge}>
                                                            <span>▶</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className={styles.removeGalleryBtn}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeGalleryVideo(index);
                                                            }}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className={styles.galleryInfo}>
                                                <span>Добавлено видео: {galleryPreviews.length}</span>
                                                <button
                                                    type="button"
                                                    className={styles.addMoreBtn}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        galleryVideoInputRef.current?.click();
                                                    }}
                                                >
                                                    + Добавить еще
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className={styles.galleryUploadPlaceholder}>
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2"/>
                                                <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                                            </svg>
                                            <span>Добавить видео в галерею</span>
                                            <span className={styles.uploadHint}>Можно выбрать несколько</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>
                                    <span className={styles.required}>*</span> Дата публикации
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>
                            
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