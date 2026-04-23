import styles from './Loader.module.scss';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({ size = 'md', fullScreen = false }) => {
  const content = (
    <div className={`${styles.loader} ${styles[size]}`}>
      <div className={styles.spinner}></div>
      <p>Загрузка...</p>
    </div>
  );

  if (fullScreen) {
    return <div className={styles.fullScreen}>{content}</div>;
  }

  return content;
};