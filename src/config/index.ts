export const config = {
  siteUrl: 'https://mptazalyk.kg',
  api: {
    baseUrl: import.meta.env.VITE_API_URL,
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  },
  upload: {
    maxImageSize: 20 * 1024 * 1024,
    maxVideoSize: 100 * 1024 * 1024,
    acceptedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    acceptedVideoTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    imageMaxDimension: 1920,
    imageQuality: 0.82,
    timeoutMs: 15 * 60 * 1000,
  },
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50, 100],
  },
};
