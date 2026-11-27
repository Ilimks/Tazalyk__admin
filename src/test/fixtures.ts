import type { UploadLimits } from '@/api/uploads';
import type { Order } from '@/types';

const MB = 1024 * 1024;

export const UPLOAD_LIMITS: UploadLimits = {
  document: {
    maxBytes: 50 * MB,
    types: [
      'application/msword',
      'application/octet-stream',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
  },
  image: { maxBytes: 20 * MB, types: ['image/gif', 'image/jpeg', 'image/png', 'image/webp'] },
  video: { maxBytes: 100 * MB, types: ['video/mp4', 'video/ogg', 'video/quicktime', 'video/webm'] },
};

export const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 7,
  customer_name: 'Тестовый Покупатель',
  phone: '+996 555 000 111',
  telegram: '',
  contact_method: 'whatsapp',
  contact_label: 'WhatsApp',
  customer_whatsapp_url: 'https://wa.me/996555000111',
  customer_telegram_url: 'https://t.me/+996555000111',
  delivery_method: 'pickup',
  delivery_label: 'Самовывоз',
  address: '',
  comment: '',
  status: 'new',
  status_label: 'Новый',
  total: '2400.00',
  manager_note: '',
  telegram_notified: true,
  items: [
    {
      id: 1,
      product: 'p-1',
      product_name: 'Контейнер пластиковый',
      volume: 120,
      price: '1200.00',
      quantity: 2,
      subtotal: '2400.00',
    },
  ],
  created_at: '2026-11-26T08:15:00Z',
  updated_at: '2026-11-26T08:15:00Z',
  ...overrides,
});
