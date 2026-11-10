import { Camera, ChevronRight } from 'lucide-react';
import styles from '@/features/Orders/OrdersManager.module.scss';
import own from '../ComplaintsManager.module.scss';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatters } from '@/utils/formatters';
import { COMPLAINT_STATUS_BADGES, COMPLAINT_STATUS_LABELS, COMPLAINT_TYPE_LABELS } from '../statuses';
import type { Complaint } from '@/types';

interface ComplaintTableProps {
  complaints: Complaint[];
  // идёт перезагрузка списка (фильтр, смена страницы)
  busy?: boolean;
  onOpen: (complaint: Complaint) => void;
}

export const ComplaintTable: React.FC<ComplaintTableProps> = ({ complaints, busy = false, onOpen }) => (
  <div className={`${styles.tableCard} ${busy ? styles.busy : ''}`} aria-busy={busy}>
    <div className={styles.tableScroll}>
      <table className={`${styles.table} ${own.table}`}>
        <thead>
          <tr>
            <th className={own.dateCell}>Дата</th>
            <th className={own.authorCell}>Заявитель</th>
            <th className={own.typeCell}>Тип</th>
            <th className={own.subjectCell}>Тема</th>
            <th className={own.photosCell}>Фото</th>
            <th className={styles.statusCell}>Статус</th>
            <th className={styles.openCell}>
              <span className={styles.srOnly}>Открыть</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {complaints.map((complaint) => (
            <tr
              key={complaint.id}
              tabIndex={0}
              onClick={() => onOpen(complaint)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpen(complaint);
                }
              }}
            >
              <td className={own.dateCell}>
                <time className={styles.secondary} dateTime={complaint.created_at}>
                  {formatters.datetime(complaint.created_at)}
                </time>
              </td>
              <td className={own.authorCell}>
                <span className={styles.customer} title={complaint.full_name}>
                  {complaint.full_name}
                </span>
                <span className={styles.secondary}>{complaint.phone}</span>
              </td>
              <td className={own.typeCell}>
                <span className={own.typeText}>
                  {complaint.type_label || COMPLAINT_TYPE_LABELS[complaint.complaint_type]}
                </span>
              </td>
              <td className={own.subjectCell}>
                <span className={styles.primary} title={complaint.subject}>
                  {complaint.subject}
                </span>
              </td>
              <td className={own.photosCell}>
                {complaint.photos?.length ? (
                  <span className={own.photoCount} title={`Фото: ${complaint.photos.length}`}>
                    <Camera size={15} />
                    {complaint.photos.length}
                  </span>
                ) : (
                  <span className={own.noPhotos} title="Без фото">
                    —
                  </span>
                )}
              </td>
              <td className={styles.statusCell}>
                <StatusBadge
                  status={COMPLAINT_STATUS_BADGES[complaint.status] || 'info'}
                  size="sm"
                  label={COMPLAINT_STATUS_LABELS[complaint.status] || complaint.status_label}
                />
              </td>
              <td className={styles.openCell}>
                <ChevronRight size={18} className={styles.openIcon} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
