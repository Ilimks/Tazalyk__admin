import type { ProductMaterial } from '@/types';

// те же варианты, что и на сервере (Product.MATERIAL_CHOICES)
export const MATERIAL_OPTIONS: { value: ProductMaterial; label: string }[] = [
  { value: 'plastic', label: 'Пластик' },
  { value: 'metal', label: 'Металл' },
  { value: 'galvanized', label: 'Оцинкованный металл' },
];
