import { ChevronRight } from 'lucide-react';
import styles from '@/features/Orders/OrdersManager.module.scss';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatters } from '@/utils/formatters';
import { APPLICATION_STATUS_BADGES, APPLICATION_STATUS_LABELS } from '../statuses';
import type { VacancyApplication } from '@/types';

interface ApplicationTableProps {
  applications: VacancyApplication[];
  // идёт перезагрузка списка (фильтр, смена страницы)
  busy?: boolean;
  onOpen: (application: VacancyApplication) => void;
}

export const ApplicationTable: React.FC<ApplicationTableProps> = ({ applications, busy = false, onOpen }) => (
  <div className={`${styles.tableCard} ${busy ? styles.busy : ''}`} aria-busy={busy}>
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.customerCell}>Кандидат</th>
            <th className={styles.deliveryCell}>Вакансия</th>
            <th className={styles.numberCell}>Дата</th>
            <th className={styles.statusCell}>Статус</th>
            <th className={styles.openCell}>
              <span className={styles.srOnly}>Открыть</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => (
            <tr
              key={application.id}
              tabIndex={0}
              onClick={() => onOpen(application)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpen(application);
                }
              }}
            >
              <td className={styles.customerCell}>
                <span className={styles.customer} title={application.full_name}>
                  {application.full_name}
                </span>
                <span className={styles.secondary}>{application.phone}</span>
              </td>
              <td className={styles.deliveryCell}>
                <span className={styles.primary}>{application.vacancy_title}</span>
              </td>
              <td className={styles.numberCell}>
                <time className={styles.secondary} dateTime={application.created_at}>
                  {formatters.datetime(application.created_at)}
                </time>
              </td>
              <td className={styles.statusCell}>
                <StatusBadge
                  status={APPLICATION_STATUS_BADGES[application.status] || 'info'}
                  size="sm"
                  label={APPLICATION_STATUS_LABELS[application.status] || application.status_label}
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
