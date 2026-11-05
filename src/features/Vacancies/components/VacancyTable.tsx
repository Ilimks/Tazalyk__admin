import { Pencil, Trash2 } from 'lucide-react';
import styles from '../VacanciesManager.module.scss';
import { formatters } from '@/utils/formatters';
import { formatSalary } from '../salary';
import type { Vacancy } from '@/types';

interface VacancyTableProps {
  vacancies: Vacancy[];
  // идёт перезагрузка списка (фильтр, смена страницы, удаление) — таблица приглушается
  busy?: boolean;
  // id вакансий, у которых сейчас сохраняется переключатель
  toggling: string[];
  // без обработчика переключатель только показывает состояние, кнопки не показываются (нет прав)
  onToggle?: (vacancy: Vacancy) => void;
  onEdit?: (vacancy: Vacancy) => void;
  onDelete?: (id: string) => void;
}

export const VacancyTable: React.FC<VacancyTableProps> = ({
  vacancies,
  busy = false,
  toggling,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const hasActions = Boolean(onEdit || onDelete);

  return (
    <div className={`${styles.tableCard} ${busy ? styles.busy : ''}`} aria-busy={busy}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.titleCell}>Должность</th>
              <th className={styles.salaryCell}>Зарплата</th>
              <th className={styles.scheduleCell}>График</th>
              <th className={styles.statusCell}>На сайте</th>
              <th className={styles.dateCell}>Изменена</th>
              {hasActions && (
                <th className={styles.actionsCell}>
                  <span className={styles.srOnly}>Действия</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {vacancies.map((vacancy) => {
              const isToggling = toggling.includes(vacancy.id);
              return (
                <tr key={vacancy.id}>
                  <td className={styles.titleCell}>
                    <span
                      className={`${styles.title} ${vacancy.is_active ? '' : styles.titleMuted}`}
                      title={vacancy.title_ru}
                    >
                      {vacancy.title_ru}
                    </span>
                    {vacancy.title_ky && (
                      <span className={styles.subtitle}>
                        <span className={styles.langTag}>KY</span>
                        <span className={styles.subtitleText} title={vacancy.title_ky}>
                          {vacancy.title_ky}
                        </span>
                      </span>
                    )}
                  </td>
                  <td className={styles.salaryCell}>{formatSalary(vacancy.salary_from, vacancy.salary_to)}</td>
                  <td className={styles.scheduleCell} title={vacancy.schedule_ru || undefined}>
                    {vacancy.schedule_ru || <span className={styles.muted}>—</span>}
                  </td>
                  <td className={styles.statusCell}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={vacancy.is_active}
                      aria-label={`Вакансия «${vacancy.title_ru}» на сайте`}
                      className={`${styles.switch} ${vacancy.is_active ? styles.switchOn : ''} ${onToggle ? '' : styles.readOnly}`}
                      onClick={onToggle ? () => onToggle(vacancy) : undefined}
                      disabled={isToggling}
                      title={onToggle ? (vacancy.is_active ? 'Отключить — вакансия пропадёт с сайта' : 'Включить — вакансия появится на сайте') : undefined}
                    >
                      <span className={styles.switchTrack} aria-hidden />
                      {vacancy.is_active ? 'Активна' : 'Неактивна'}
                    </button>
                  </td>
                  <td className={styles.dateCell}>{formatters.date(vacancy.updated_at)}</td>
                  {hasActions && (
                    <td className={styles.actionsCell}>
                      <div className={styles.actions}>
                        {onEdit && (
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => onEdit(vacancy)}
                            aria-label={`Редактировать вакансию «${vacancy.title_ru}»`}
                            title="Редактировать"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.danger}`}
                            onClick={() => onDelete(vacancy.id)}
                            aria-label={`Удалить вакансию «${vacancy.title_ru}»`}
                            title="Удалить"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
