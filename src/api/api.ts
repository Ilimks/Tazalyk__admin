// src/api/api.ts
const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const api = {
    // ========== АУТЕНТИФИКАЦИЯ ==========
    login: async (password: string) => {
        const response = await fetch(`${API_BASE_URL}/admin-login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        return response.json();
    },

    // ========== СИНХРОНИЗАЦИЯ ДАННЫХ ==========
    // Импорт данных из localStorage в базу
    importData: async (data: any) => {
        const response = await fetch(`${API_BASE_URL}/import-data/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // ========== ВИДЕО ==========
    getVideos: async () => {
        const response = await fetch(`${API_BASE_URL}/videos/`);
        return response.json();
    },
    
    createVideo: async (video: any) => {
        const response = await fetch(`${API_BASE_URL}/videos/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(video)
        });
        return response.json();
    },
    
    updateVideo: async (id: string, video: any) => {
        const response = await fetch(`${API_BASE_URL}/videos/${id}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(video)
        });
        return response.json();
    },
    
    deleteVideo: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/videos/${id}/`, {
            method: 'DELETE'
        });
        return response.json();
    },

    // ========== ФОТО ==========
    getPhotos: async () => {
        const response = await fetch(`${API_BASE_URL}/photos/`);
        return response.json();
    },
    
    createPhoto: async (photo: any) => {
        const response = await fetch(`${API_BASE_URL}/photos/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(photo)
        });
        return response.json();
    },
    
    updatePhoto: async (id: string, photo: any) => {
        const response = await fetch(`${API_BASE_URL}/photos/${id}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(photo)
        });
        return response.json();
    },
    
    deletePhoto: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/photos/${id}/`, {
            method: 'DELETE'
        });
        return response.json();
    },

    // ========== НОВОСТИ ==========
    getNews: async () => {
        const response = await fetch(`${API_BASE_URL}/news/`);
        return response.json();
    },
    
    createNews: async (news: any) => {
        const response = await fetch(`${API_BASE_URL}/news/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(news)
        });
        return response.json();
    },
    
    updateNews: async (id: string, news: any) => {
        const response = await fetch(`${API_BASE_URL}/news/${id}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(news)
        });
        return response.json();
    },
    
    deleteNews: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/news/${id}/`, {
            method: 'DELETE'
        });
        return response.json();
    },

    // ========== ЗАКУПКИ ==========
    getProcurements: async () => {
        const response = await fetch(`${API_BASE_URL}/procurements/`);
        return response.json();
    },
    
    createProcurement: async (procurement: any) => {
        const response = await fetch(`${API_BASE_URL}/procurements/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(procurement)
        });
        return response.json();
    },
    
    updateProcurement: async (id: string, procurement: any) => {
        const response = await fetch(`${API_BASE_URL}/procurements/${id}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(procurement)
        });
        return response.json();
    },
    
    // api.ts
    deleteProcurement: async (id: string) => {
        console.log(`📤 Удаление закупки с ID: ${id}`);
        const response = await fetch(`${API_BASE_URL}/procurements/${id}/`, {
            method: 'DELETE'
        });
        
        console.log(`📥 Статус ответа: ${response.status}`);
        
        // Для DELETE запроса сервер может вернуть пустой ответ
        if (response.status === 204 || response.status === 404) {
            return { success: true };
        }
        
        // Пытаемся распарсить JSON только если есть содержимое
        const text = await response.text();
        if (text && text.length > 0) {
            try {
                return JSON.parse(text);
            } catch (e) {
                console.warn('Не удалось распарсить ответ:', text);
                return { success: true };
            }
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return { success: true };
    },

    // ========== ВАКАНСИИ ==========
    getVacancies: async () => {
        const response = await fetch(`${API_BASE_URL}/vacancies/`);
        return response.json();
    },
    
    createVacancy: async (vacancy: any) => {
        const response = await fetch(`${API_BASE_URL}/vacancies/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vacancy)
        });
        return response.json();
    },
    
    updateVacancy: async (id: string, vacancy: any) => {
        const response = await fetch(`${API_BASE_URL}/vacancies/${id}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vacancy)
        });
        return response.json();
    },
    
    deleteVacancy: async (id: string) => {
        const response = await fetch(`${API_BASE_URL}/vacancies/${id}/`, {
            method: 'DELETE'
        });
        return response.json();
    }
};