import styles from '../Dashboard.module.scss';

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  color: string;
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  color,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className={styles.statCard}>
        <div className={styles.statIcon} style={{ background: color }}>
          {icon}
        </div>
        <div className={styles.statInfo}>
          <div className={styles.skeleton}></div>
          <p>{label}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: color }}>
        {icon}
      </div>
      <div className={styles.statInfo}>
        <h3>{value}</h3>
        <p>{label}</p>
      </div>
    </div>
  );
};