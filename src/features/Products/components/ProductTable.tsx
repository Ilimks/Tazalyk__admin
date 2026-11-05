import { ImageOff, Pencil, Trash2 } from 'lucide-react';
import styles from '../ProductsManager.module.scss';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatters } from '@/utils/formatters';
import type { Product } from '@/types';

interface ProductTableProps {
  products: Product[];
  // идёт перезагрузка списка (поиск, смена страницы, удаление) — таблица приглушается
  busy?: boolean;
  // без обработчика кнопка не показывается (нет прав)
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({ products, busy = false, onEdit, onDelete }) => {
  const hasActions = Boolean(onEdit || onDelete);

  return (
    <div className={`${styles.tableCard} ${busy ? styles.busy : ''}`} aria-busy={busy}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.imageCell}>Фото</th>
              <th className={styles.nameCell}>Товар</th>
              <th className={styles.volumeCell}>Объём</th>
              <th className={styles.materialCell}>Материал</th>
              <th className={styles.priceCell}>Цена</th>
              <th className={styles.badgesCell}>Статус</th>
              {hasActions && (
                <th className={styles.actionsCell}>
                  <span className={styles.srOnly}>Действия</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td className={styles.imageCell}>
                  {product.image ? (
                    <img
                      src={product.image}
                      alt=""
                      width={56}
                      height={40}
                      loading="lazy"
                      decoding="async"
                      className={styles.thumbnail}
                    />
                  ) : (
                    <span className={styles.thumbnailEmpty} title="Нет фото">
                      <ImageOff size={16} />
                    </span>
                  )}
                </td>
                <td className={styles.nameCell}>
                  <span
                    className={`${styles.title} ${product.is_active ? '' : styles.titleMuted}`}
                    title={product.name_ru}
                  >
                    {product.name_ru}
                  </span>
                  {product.name_ky && (
                    <span className={styles.subtitle}>
                      <span className={styles.langTag}>KY</span>
                      <span className={styles.subtitleText} title={product.name_ky}>
                        {product.name_ky}
                      </span>
                    </span>
                  )}
                </td>
                <td className={styles.volumeCell}>{product.volume} л</td>
                <td className={styles.materialCell}>{product.material_label || product.material}</td>
                <td className={styles.priceCell}>
                  <span className={styles.amount}>{formatters.amount(product.price)}</span>
                  <span className={styles.currency}>сом</span>
                </td>
                <td className={styles.badgesCell}>
                  <div className={styles.badges}>
                    {product.in_stock ? (
                      <StatusBadge status="success" size="sm" label="В наличии" />
                    ) : (
                      <StatusBadge status="warning" size="sm" label="Нет в наличии" />
                    )}
                    {product.is_featured && <StatusBadge status="info" size="sm" label="На главной" />}
                    {!product.is_active && <StatusBadge status="closed" size="sm" label="Скрыт" />}
                  </div>
                </td>
                {hasActions && (
                  <td className={styles.actionsCell}>
                    <div className={styles.actions}>
                      {onEdit && (
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => onEdit(product)}
                          aria-label={`Редактировать товар «${product.name_ru}»`}
                          title="Редактировать"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.danger}`}
                          onClick={() => onDelete(product.id)}
                          aria-label={`Удалить товар «${product.name_ru}»`}
                          title="Удалить"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
