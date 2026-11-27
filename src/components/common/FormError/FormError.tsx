import { CircleAlert } from 'lucide-react';
import styles from './FormError.module.scss';

export const FormError: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <div className={styles.formError} role="alert">
      <CircleAlert size={18} />
      <span>{message}</span>
    </div>
  ) : null;
