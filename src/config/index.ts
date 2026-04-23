export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  },
  auth: {
    admin: {
      username: import.meta.env.VITE_ADMIN_USERNAME || 'admin',
      password: import.meta.env.VITE_ADMIN_PASSWORD || 'admin123',
    },
    content: {
      username: import.meta.env.VITE_CONTENT_USERNAME || 'content_manager',
      password: import.meta.env.VITE_CONTENT_PASSWORD || 'content123',
    },
    procurement: {
      username: import.meta.env.VITE_PROCUREMENT_USERNAME || 'procurement_manager',
      password: import.meta.env.VITE_PROCUREMENT_PASSWORD || 'procurement123',
    },
    legal: {  // Добавьте нового пользователя
      username: import.meta.env.VITE_LEGAL_USERNAME || 'legal_manager',
      password: import.meta.env.VITE_LEGAL_PASSWORD || 'legal123',
    },
    viewer: {
      username: import.meta.env.VITE_VIEWER_USERNAME || 'viewer',
      password: import.meta.env.VITE_VIEWER_PASSWORD || 'viewer123',
    },
  },
  upload: {
    maxImageSize: 5 * 1024 * 1024,
    maxVideoSize: 100 * 1024 * 1024,
    acceptedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    acceptedVideoTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  },
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50, 100],
  },
};

console.log('Config loaded. API URL:', config.api.baseUrl);