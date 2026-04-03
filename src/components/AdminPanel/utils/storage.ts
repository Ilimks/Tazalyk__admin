import type { Video, Photo, News, Procurement, Vacancy } from '../types';

const STORAGE_KEYS = {
    VIDEOS: 'admin_videos',
    PHOTOS: 'admin_photos',
    NEWS: 'admin_news',
    PROCUREMENTS: 'admin_procurements',
    VACANCIES: 'admin_vacancies'
};

// Видео
export const getVideos = (): Video[] => {
    const data = localStorage.getItem(STORAGE_KEYS.VIDEOS);
    return data ? JSON.parse(data) : [];
};

export const saveVideo = (video: Video) => {
    const videos = getVideos();
    videos.push(video);
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videos));
};

export const updateVideo = (id: string, video: Video) => {
    const videos = getVideos();
    const index = videos.findIndex(v => v.id === id);
    if (index !== -1) {
        videos[index] = video;
        localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videos));
    }
};

export const deleteVideo = (id: string) => {
    const videos = getVideos();
    const filtered = videos.filter(v => v.id !== id);
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(filtered));
};

// Фото
export const getPhotos = (): Photo[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PHOTOS);
    return data ? JSON.parse(data) : [];
};

export const savePhoto = (photo: Photo) => {
    const photos = getPhotos();
    photos.push(photo);
    localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
};

export const updatePhoto = (id: string, photo: Photo) => {
    const photos = getPhotos();
    const index = photos.findIndex(p => p.id === id);
    if (index !== -1) {
        photos[index] = photo;
        localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
    }
};

export const deletePhoto = (id: string) => {
    const photos = getPhotos();
    const filtered = photos.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(filtered));
};

// Новости
export const getNews = (): News[] => {
    const data = localStorage.getItem(STORAGE_KEYS.NEWS);
    return data ? JSON.parse(data) : [];
};

export const saveNews = (news: News) => {
    const newsList = getNews();
    newsList.push(news);
    localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(newsList));
};

export const updateNews = (id: string, news: News) => {
    const newsList = getNews();
    const index = newsList.findIndex(n => n.id === id);
    if (index !== -1) {
        newsList[index] = news;
        localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(newsList));
    }
};

export const deleteNews = (id: string) => {
    const newsList = getNews();
    const filtered = newsList.filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(filtered));
};

// Закупки
export const getProcurements = (): Procurement[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PROCUREMENTS);
    return data ? JSON.parse(data) : [];
};

export const saveProcurement = (procurement: Procurement) => {
    const procurements = getProcurements();
    procurements.push(procurement);
    localStorage.setItem(STORAGE_KEYS.PROCUREMENTS, JSON.stringify(procurements));
};

export const updateProcurement = (id: string, procurement: Procurement) => {
    const procurements = getProcurements();
    const index = procurements.findIndex(p => p.id === id);
    if (index !== -1) {
        procurements[index] = procurement;
        localStorage.setItem(STORAGE_KEYS.PROCUREMENTS, JSON.stringify(procurements));
    }
};

export const deleteProcurement = (id: string) => {
    const procurements = getProcurements();
    const filtered = procurements.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROCUREMENTS, JSON.stringify(filtered));
};

// Вакансии
export const getVacancies = (): Vacancy[] => {
    const data = localStorage.getItem(STORAGE_KEYS.VACANCIES);
    return data ? JSON.parse(data) : [];
};

export const saveVacancy = (vacancy: Vacancy) => {
    const vacancies = getVacancies();
    vacancies.push(vacancy);
    localStorage.setItem(STORAGE_KEYS.VACANCIES, JSON.stringify(vacancies));
};

export const updateVacancy = (id: string, vacancy: Vacancy) => {
    const vacancies = getVacancies();
    const index = vacancies.findIndex(v => v.id === id);
    if (index !== -1) {
        vacancies[index] = vacancy;
        localStorage.setItem(STORAGE_KEYS.VACANCIES, JSON.stringify(vacancies));
    }
};

export const deleteVacancy = (id: string) => {
    const vacancies = getVacancies();
    const filtered = vacancies.filter(v => v.id !== id);
    localStorage.setItem(STORAGE_KEYS.VACANCIES, JSON.stringify(filtered));
};