import type { ProductMaterial } from '@/types';

export const MATERIAL_OPTIONS: { value: ProductMaterial; label: string }[] = [
  { value: 'plastic', label: 'Пластик' },
  { value: 'metal', label: 'Металл' },
  { value: 'galvanized', label: 'Оцинкованный металл' },
];
