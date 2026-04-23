import React, { useRef, useState } from 'react';
import styles from '../VideosManager.module.scss';
import { Button } from '@/components/common/Button';
import type { Video } from '@/types';

interface VideoCardProps {
  video: Video;
  onEdit: () => void;
  onDelete: () => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onEdit, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    videoRef.current?.play();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div 
      className={styles.videoCard}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.videoThumbnail}>
        <video
          ref={videoRef}
          src={video.main_video_url}
          muted
          loop
          playsInline
        />
        {!isHovered && (
          <div className={styles.videoOverlay}>
            <span>▶</span>
          </div>
        )}
        {video.gallery_videos?.length > 0 && (
          <div className={styles.galleryCount}>
            +{video.gallery_videos.length}
          </div>
        )}
      </div>
      <div className={styles.videoInfo}>
        {/* Убираем title */}
        <span className={styles.videoDate}>
          {new Date(video.date).toLocaleDateString('ru-RU')}
        </span>
      </div>
      <div className={styles.videoActions}>
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