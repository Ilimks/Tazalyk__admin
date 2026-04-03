export interface Video {
    id: string;
    title: string;
    description?: string;
    main_video_url: string;  // теперь base64
    gallery_videos: string[]; // массив base64
    date: string;
    created_at: string;
}

export interface Photo {
    id: string;
    title: string;
    description: string;
    main_image: string;        // Главное фото
    gallery_images: string[];  // Дополнительные фото (массив ссылок)
    date: string;
    created_at: string;
}

export interface News {
    id: string;
    title: string;
    description: string;
    image: string;
    date: string;
    createdAt: string;
}

export interface Procurement {
    id: string;  // Убираем опциональность, делаем обязательным
    number: string;
    contractNumber: string;
    supplier: string;
    type: string;
    method: string;
    status: 'active' | 'completed' | 'cancelled';
    date: string;
    amount: number;
    createdAt?: string;
}

export interface Vacancy {
    id: string;
    title: string;
    salaryFrom: string;
    salaryTo: string;
    schedule: string;
    experience: string;
    description: string;
    requirements: string[];
    responsibilities: string[];
    conditions: string[];
    status: 'open' | 'closed';
    publishedAt: string;
    createdAt: string;
}

export interface PhotoFormData {
    title: string;
    description: string;
    main_image: File | string;
    gallery_images: (File | string)[];
    date: string;
}

export interface VideoFormData {
    title: string;
    description: string;
    main_video_url: string;
    gallery_videos: string[];
    date: string;
}

export type ActiveTab = 'dashboard' | 'videos' | 'photos' | 'news' | 'procurements' | 'vacancies';