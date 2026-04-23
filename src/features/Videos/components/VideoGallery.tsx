import React, { useState } from 'react';
import styles from '../VideosManager.module.scss';
import { Modal } from '@/components/common/Modal';
import type { Video } from '@/types';

interface VideoGalleryProps {
  videos: Video[];
  onEdit?: (video: Video) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

export const VideoGallery: React.FC<VideoGalleryProps> = ({ 
  videos, 
  onEdit, 
  onDelete, 
  isAdmin = false 
}) => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  return (
    <>
      <div className={styles.videosGrid}>
        {videos.map((video) => (
          <div
            key={video.id}
            className={styles.videoCard}
            onClick={() => setSelectedVideo(video)}
          >
            <div className={styles.videoThumbnail}>
              <video src={video.main_video_url} muted />
              <div className={styles.videoOverlay}>
                <span>▶</span>
              </div>
              {video.gallery_videos?.length > 0 && (
                <div className={styles.galleryCount}>
                  +{video.gallery_videos.length}
                </div>
              )}
            </div>
            <div className={styles.videoInfo}>
              <span className={styles.videoDate}>
                {new Date(video.date).toLocaleDateString('ru-RU')}
              </span>
            </div>
            {isAdmin && onEdit && onDelete && (
              <div className={styles.videoActions}>
                <button 
                  className={styles.editBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(video);
                  }}
                >
                  ✏️
                </button>
                <button 
                  className={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(video.id);
                  }}
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        title=''
        size="lg"
      >
        {selectedVideo && (
          <div>
            <video
              src={selectedVideo.main_video_url}
              controls
              className={styles.fullVideo}
              style={{ width: '100%', maxHeight: '400px' }}
              autoPlay
            />
            {selectedVideo.gallery_videos?.length > 0 && (
              <div>
                <h4 style={{ marginTop: '20px', marginBottom: '12px' }}>
                  Дополнительные видео ({selectedVideo.gallery_videos.length})
                </h4>
                <div className={styles.galleryPreviewGrid}>
                  {selectedVideo.gallery_videos.map((url, idx) => (
                    <div key={idx} className={styles.galleryPreviewItem}>
                      <video src={url} controls className={styles.galleryVideoPreview} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};