// Логины и пароли здесь не хранятся: переменные VITE_* попадают в JS, который скачивает браузер.
// Вход проверяет сервер (/api/token/).
export const config = {
  // ссылка «Открыть сайт» в меню. Не читаем её из import.meta.env: обращение к переменной,
  // которой нет в .env, заставляет Vite вставить в сборку весь объект env вместе с секретами
  siteUrl: 'https://mptazalyk.kg',
  api: {
    baseUrl: import.meta.env.VITE_API_URL,
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  },
  upload: {
    // исходное фото может быть большим — перед загрузкой оно всё равно уменьшается
    maxImageSize: 20 * 1024 * 1024,
    maxVideoSize: 100 * 1024 * 1024,
    acceptedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    acceptedVideoTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    // фото уменьшаются в браузере перед загрузкой
    imageMaxDimension: 1920,
    imageQuality: 0.82,
  },
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50, 100],
  },
};
