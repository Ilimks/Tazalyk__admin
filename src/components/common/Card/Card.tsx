import styles from './Card.module.scss';

interface CardProps {
  children?: React.ReactNode;
  image?: string;
  title?: string;
  description?: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  image,
  title,
  description,
  meta,
  actions,
  onClick,
  className = '',
  hoverable = true,
}) => {
  return (
    <div
      className={`${styles.card} ${hoverable ? styles.hoverable : ''} ${onClick ? styles.clickable : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {image && (
        <div className={styles.image}>
          <img src={image} alt={title || 'Card image'} />
        </div>
      )}
      <div className={styles.content}>
        {title && <h4 className={styles.title}>{title}</h4>}
        {description && <p className={styles.description}>{description}</p>}
        {meta && <div className={styles.meta}>{meta}</div>}
        {children}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
};