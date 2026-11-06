import React, { useState } from 'react';
import { ClipboardCheck, Download, FileText, Mail, MessageCircle, Phone, Trash2, UserRound } from 'lucide-react';
import styles from '@/features/Orders/OrdersManager.module.scss';
import { applicationsService } from '@/api/services/applications.service';
import { useApplicationsStore } from '@/store';
import { useNotificationStore } from '@/store/notification.store';
import { Button } from '@/components/common/Button';
import { Select, Textarea } from '@/components/common/Form';
import { StatusBadge } from '@/components/common/StatusBadge';
import { saveBlob } from '@/utils/download';
import { formatters } from '@/utils/formatters';
import { APPLICATION_STATUS_BADGES, APPLICATION_STATUS_LABELS, APPLICATION_STATUS_OPTIONS } from '../statuses';
import type { ApplicationStatus, ApplicationUpdate, VacancyApplication } from '@/types';

interface ApplicationDetailsProps {
  application: VacancyApplication;
  allowEdit: boolean;
  allowDelete: boolean;
  onSaved: (application: VacancyApplication) => void;
  onDelete: () => void;
  onClose: () => void;
}

// для ссылки tel: оставляем только цифры и плюс
const phoneHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

// WhatsApp принимает номер только с кодом страны: в Кыргызстане часто пишут 0700… или 700…
const whatsappHref = (phone: string) => {
  const digits = phone.replace(/\D/g, '').replace(/^00/, '');
  const local = digits.length === 10 && digits.startsWith('0') ? digits.slice(1) : digits;
  return `https://wa.me/${local.length === 9 ? `996${local}` : local}`;
};

export const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({
  application,
  allowEdit,
  allowDelete,
  onSaved,
  onDelete,
  onClose,
}) => {
  const { updateApplication } = useApplicationsStore();
  const { showNotification } = useNotificationStore();
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [note, setNote] = useState(application.hr_note || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isDirty = status !== application.status || note !== (application.hr_note || '');

  const handleDownload = async () => {
    setDownloading(true);
    try {
      saveBlob(await applicationsService.downloadResume(application.id), application.resume_name);
    } catch {
      showNotification('Не удалось скачать резюме. Попробуйте ещё раз.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;

    const changes: ApplicationUpdate = {};
    if (status !== application.status) changes.status = status;
    if (note !== (application.hr_note || '')) changes.hr_note = note;

    setSaving(true);
    const result = await updateApplication(application.id, changes);
    setSaving(false);

    if (result.success && result.data) {
      onSaved(result.data);
      return;
    }
    setErrors(result.fieldErrors || {});
    showNotification(result.message || 'Не удалось сохранить', 'error');
  };

  return (
    <form className={styles.details} onSubmit={handleSubmit}>
      <div className={styles.detailsHead}>
        <StatusBadge
          status={APPLICATION_STATUS_BADGES[application.status] || 'info'}
          label={APPLICATION_STATUS_LABELS[application.status] || application.status_label}
        />
        <span>
          Получен <time dateTime={application.created_at}>{formatters.datetime(application.created_at)}</time>
        </span>
      </div>

      <div className={styles.infoGrid}>
        <section className={styles.formSection}>
          <div className={styles.formSectionHead}>
            <span className={styles.sectionIcon}>
              <UserRound size={16} />
            </span>
            <div className={styles.formSectionText}>
              <h4 className={styles.formSectionTitle}>Кандидат</h4>
            </div>
          </div>
          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>ФИО</span>
              <span className={styles.infoValue}>{application.full_name}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Телефон</span>
              <span className={styles.contactLinks}>
                <a className={styles.contactLink} href={phoneHref(application.phone)}>
                  <Phone size={15} />
                  {application.phone}
                </a>
                <a className={styles.contactLink} href={whatsappHref(application.phone)} target="_blank" rel="noreferrer">
                  <MessageCircle size={15} />
                  WhatsApp
                </a>
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Почта</span>
              {application.email ? (
                <a className={styles.contactLink} href={`mailto:${encodeURIComponent(application.email).replace('%40', '@')}`}>
                  <Mail size={15} />
                  {application.email}
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
              <FileText size={16} />
            </span>
            <div className={styles.formSectionText}>
              <h4 className={styles.formSectionTitle}>Отклик</h4>
            </div>
          </div>
          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Вакансия</span>
              <span className={styles.infoValue}>{application.vacancy_title}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Комментарий кандидата</span>
              {application.comment ? (
                <span className={styles.infoValue}>{application.comment}</span>
              ) : (
                <span className={`${styles.infoValue} ${styles.muted}`}>Нет</span>
              )}
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Резюме · {formatters.fileSize(application.resume_size)}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                icon={<Download />}
                loading={downloading}
                onClick={handleDownload}
              >
                Скачать резюме
              </Button>
            </div>
          </div>
        </section>
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
          label="Статус отклика"
          value={status}
          onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
          options={APPLICATION_STATUS_OPTIONS}
          error={errors.status}
          disabled={!allowEdit}
        />
        <Textarea
          label="Заметка отдела кадров"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          error={errors.hr_note}
          rows={3}
          placeholder="Например: созвонились, собеседование в среду в 10:00"
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
            Удалить отклик
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
