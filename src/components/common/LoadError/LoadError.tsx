import { CloudOff, RotateCw } from 'lucide-react';
import { Button } from '../Button';
import styles from './LoadError.module.scss';

interface LoadErrorProps {
  message: string;
  onRetry: () => void;
}

export const LoadError: React.FC<LoadErrorProps> = ({ message, onRetry }) => (
  <div className={styles.loadError} role="alert">
    <span className={styles.icon}>
      <CloudOff size={28} />
    </span>
    <h3>Не удалось загрузить список</h3>
    <p>{message}</p>
    <div className={styles.action}>
      <Button variant="outline" onClick={onRetry}>
        <RotateCw size={16} />
        Повторить
      </Button>
    </div>
  </div>
);
