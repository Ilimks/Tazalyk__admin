import { CircleAlert } from 'lucide-react';
import styles from './FormError.module.scss';

// Что пошло не так при сохранении — над кнопками формы, а не всплывающим окном браузера
export const FormError: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <div className={styles.formError} role="alert">
      <CircleAlert size={18} />
      <span>{message}</span>
    </div>
  ) : null;
