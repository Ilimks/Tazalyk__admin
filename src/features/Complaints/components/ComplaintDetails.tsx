import React, { useState } from 'react';
import { Camera, ClipboardCheck, FileText, Mail, MapPin, Phone, Trash2, UserRound } from 'lucide-react';
import styles from '@/features/Orders/OrdersManager.module.scss';
import own from '../ComplaintsManager.module.scss';
import { useComplaintsStore } from '@/store';
import { useNotificationStore } from '@/store/notification.store';
import { Button } from '@/components/common/Button';
import { Select, Textarea } from '@/components/common/Form';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatters } from '@/utils/formatters';
import { ComplaintPhotos } from './ComplaintPhotos';
import {
  COMPLAINT_STATUS_BADGES,
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_STATUS_OPTIONS,
  COMPLAINT_TYPE_LABELS,
} from '../statuses';
import type { Complaint, ComplaintStatus, ComplaintUpdate } from '@/types';

interface ComplaintDetailsProps {
  complaint: Complaint;
  allowEdit: boolean;
  allowDelete: boolean;
  onSaved: (complaint: Complaint) => void;
  onDelete: () => void;
  onClose: () => void;
}

// для ссылки tel: оставляем только цифры и плюс
const phoneHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

// '2026-05-01' → '01.05.2026' без new Date: это полночь по UTC, и западнее Гринвича показался бы прошлый день
const formatDay = (value: string) => value.split('-').reverse().join('.');

export const ComplaintDetails: React.FC<ComplaintDetailsProps> = ({
  complaint,
  allowEdit,
  allowDelete,
  onSaved,
  onDelete,
  onClose,
}) => {
  const { updateComplaint } = useComplaintsStore();
  const { showNotification } = useNotificationStore();
  const [status, setStatus] = useState<ComplaintStatus>(complaint.status);
  const [note, setNote] = useState(complaint.manager_note || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const photos = complaint.photos || [];
  const isDirty = status !== complaint.status || note !== (complaint.manager_note || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;

    const changes: ComplaintUpdate = {};
    if (status !== complaint.status) changes.status = status;
    if (note !== (complaint.manager_note || '')) changes.manager_note = note;

    setSaving(true);
    const result = await updateComplaint(complaint.id, changes);
    setSaving(false);

    if (result.success && result.data) {
      onSaved(result.data);
      return;
    }
    // ошибки по другим полям в форме не показать — добавляем их к уведомлению
    const fieldErrors = result.fieldErrors || {};
    setErrors(fieldErrors);
    const other = Object.entries(fieldErrors)
      .filter(([field]) => field !== 'status' && field !== 'manager_note')
      .map(([, text]) => text);
    showNotification([result.message, ...other].filter(Boolean).join(' '), 'error');
  };

  return (
    <form className={styles.details} onSubmit={handleSubmit}>
      <div className={styles.detailsHead}>
        <StatusBadge
          status={COMPLAINT_STATUS_BADGES[complaint.status] || 'info'}
          label={COMPLAINT_STATUS_LABELS[complaint.status] || complaint.status_label}
        />
        <span>
          Получена <time dateTime={complaint.created_at}>{formatters.datetime(complaint.created_at)}</time>
        </span>
      </div>

      <div className={styles.infoGrid}>
        <section className={`${styles.formSection} ${own.wide}`}>
          <div className={styles.formSectionHead}>
            <span className={styles.sectionIcon}>
              <FileText size={16} />
            </span>
            <div className={styles.formSectionText}>
              <h4 className={styles.formSectionTitle}>Обращение</h4>
            </div>
          </div>
          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Тип обращения</span>
              <span className={styles.infoValue}>
                {complaint.type_label || COMPLAINT_TYPE_LABELS[complaint.complaint_type]}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Тема</span>
              <span className={styles.infoValue}>{complaint.subject}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Текст обращения</span>
              {complaint.description ? (
                <span className={styles.infoValue}>{complaint.description}</span>
              ) : (
                <span className={`${styles.infoValue} ${styles.muted}`}>Нет</span>
              )}
            </div>
            {photos.length === 0 && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Фото</span>
                <span className={`${styles.infoValue} ${styles.muted}`}>Не приложены</span>
              </div>
            )}
          </div>
        </section>

        <section className={styles.formSection}>
          <div className={styles.formSectionHead}>
            <span className={styles.sectionIcon}>
              <UserRound size={16} />
            </span>
            <div className={styles.formSectionText}>
              <h4 className={styles.formSectionTitle}>Заявитель</h4>
            </div>
          </div>
          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>ФИО</span>
              <span className={styles.infoValue}>{complaint.full_name}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Телефон</span>
              {complaint.phone ? (
                <a className={styles.contactLink} href={phoneHref(complaint.phone)}>
                  <Phone size={15} />
                  {complaint.phone}
                </a>
              ) : (
                <span className={`${styles.infoValue} ${styles.muted}`}>Не указан</span>
              )}
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Почта</span>
              {complaint.email ? (
                <a className={styles.contactLink} href={`mailto:${encodeURIComponent(complaint.email).replace('%40', '@')}`}>
                  <Mail size={15} />
                  {complaint.email}
                </a>
              ) : (
                <span className={`${styles.infoValue} ${styles.muted}`}>Не указана</span>
              )}
            </div>
          </div>
        </section>

        <section className={styles.formSection}>
          <div className={styles.formSectionHead}>
            <span className={styles.sectionIcon}>
              <MapPin size={16} />
            </span>
            <div className={styles.formSectionText}>
              <h4 className={styles.formSectionTitle}>Происшествие</h4>
            </div>
          </div>
          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Дата</span>
              {complaint.incident_date ? (
                <span className={styles.infoValue}>{formatDay(complaint.incident_date)}</span>
              ) : (
                <span className={`${styles.infoValue} ${styles.muted}`}>Не указана</span>
              )}
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Место</span>
              {complaint.incident_location ? (
                <span className={styles.infoValue}>{complaint.incident_location}</span>
              ) : (
                <span className={`${styles.infoValue} ${styles.muted}`}>Не указано</span>
              )}
            </div>
          </div>
        </section>

        {photos.length > 0 && (
          <section className={`${styles.formSection} ${own.wide}`}>
            <div className={styles.formSectionHead}>
              <span className={styles.sectionIcon}>
                <Camera size={16} />
              </span>
              <div className={styles.formSectionText}>
                <h4 className={styles.formSectionTitle}>Фото · {photos.length}</h4>
                <p className={styles.formSectionHint}>Нажмите на фото, чтобы открыть крупно</p>
              </div>
            </div>
            <ComplaintPhotos complaintId={complaint.id} photos={photos} />
          </section>
        )}
      </div>

      <section className={styles.formSection}>
        <div className={styles.formSectionHead}>
          <span className={styles.sectionIcon}>
            <ClipboardCheck size={16} />
          </span>
          <div className={styles.formSectionText}>
            <h4 className={styles.formSectionTitle}>Обработка</h4>
            <p className={styles.formSectionHint}>Статус и заметка видны только сотрудникам</p>
          </div>
        </div>
        <Select
          label="Статус жалобы"
          value={status}
          onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
          options={COMPLAINT_STATUS_OPTIONS}
          error={errors.status}
          disabled={!allowEdit}
        />
        <Textarea
          label="Заметка сотрудника"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          error={errors.manager_note}
          rows={3}
          placeholder="Например: передали бригаде, вывоз в четверг утром"
          disabled={!allowEdit}
        />
      </section>

      <div className={styles.formActions}>
        {allowDelete && (
          <Button
            type="button"
            variant="outline"
            className={`${styles.actionsStart} ${styles.deleteButton}`}
            icon={<Trash2 />}
            onClick={onDelete}
            disabled={saving}
          >
            Удалить жалобу
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Закрыть
        </Button>
        {allowEdit && (
          <Button type="submit" loading={saving} disabled={!isDirty}>
            Сохранить
          </Button>
        )}
      </div>
    </form>
  );
};
