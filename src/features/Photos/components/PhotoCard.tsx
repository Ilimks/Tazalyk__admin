import styles from '../PhotosManager.module.scss';
import { Button } from '@/components/common/Button';
import type { Photo } from '@/types';

interface PhotoCardProps {
  photo: Photo;
  onEdit: () => void;
  onDelete: () => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onEdit, onDelete }) => {
  return (
    <div className={styles.photoCard}>
      <div className={styles.photoImage}>
        <img src={photo.main_image} alt="Фото" />
        {photo.gallery_images?.length > 0 && (
          <div className={styles.galleryCount}>
            +{photo.gallery_images.length}
          </div>
        )}
      </div>
      <div className={styles.photoInfo}>
        <span className={styles.photoDate}>
          {new Date(photo.date).toLocaleDateString('ru-RU')}
        </span>
      </div>
      <div className={styles.photoActions}>
        <Button variant="outline" size="sm" onClick={onEdit}>
          ✏️
        </Button>
        <Button variant="danger" size="sm" onClick={onDelete}>
          🗑️
        </Button>
      </div>
    </div>
  );
};