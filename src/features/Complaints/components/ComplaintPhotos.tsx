import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, ImageOff, RotateCw, X } from 'lucide-react';
import own from '../ComplaintsManager.module.scss';
import { complaintsService } from '@/api/services/complaints.service';
import { saveBlob } from '@/utils/download';
import { formatters } from '@/utils/formatters';
import type { ComplaintPhoto } from '@/types';

interface OpenedPhoto {
  url: string;
  blob: Blob;
  label: string;
  fileName: string;
}

// HEIC (фото с iPhone) показывает только Safari; в остальных браузерах его можно лишь скачать
const isHeic = (contentType: string) => /hei[cf]/i.test(contentType);

// имя скачанного файла: image/jpeg → «Жалоба, фото 1.jpg»
const photoFileName = (contentType: string, index: number) => {
  const subtype = contentType.split('/')[1]?.split(/[;+]/)[0] || 'jpg';
  return `Жалоба, фото ${index + 1}.${subtype === 'jpeg' ? 'jpg' : subtype}`;
};

interface PhotoThumbProps {
  complaintId: string;
  photo: ComplaintPhoto;
  index: number;
  onOpen: (photo: OpenedPhoto) => void;
  onRetry: () => void;
}

const PhotoThumb: React.FC<PhotoThumbProps> = ({ complaintId, photo, index, onOpen, onRetry }) => {
  const [file, setFile] = useState<{ url: string; blob: Blob } | null>(null);
  const [failed, setFailed] = useState(false);
  // файл скачан, но браузер не смог его показать (HEIC не в Safari, битый файл)
  const [unreadable, setUnreadable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let url = '';
    complaintsService
      .downloadPhoto(complaintId, photo.id)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setFile({ url, blob });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    // ссылка держит файл в памяти вкладки: отпускаем при закрытии карточки и смене жалобы
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [complaintId, photo.id]);

  const label = `Фото ${index + 1}`;
  const title = `${label} · ${formatters.fileSize(photo.size)}`;
  const fileName = photoFileName(file?.blob.type || photo.content_type, index);

  if (failed) {
    return (
      <div className={`${own.thumb} ${own.thumbFallback}`} title={title}>
        <ImageOff size={22} />
        <span>Не загрузилось</span>
        <button type="button" className={own.thumbAction} onClick={onRetry}>
          <RotateCw size={14} />
          Повторить
        </button>
      </div>
    );
  }

  if (!file) {
    return <div className={`${own.thumb} ${own.thumbLoading}`} role="img" aria-label={`${label}: загрузка`} />;
  }

  if (unreadable) {
    return (
      <div className={`${own.thumb} ${own.thumbFallback}`} title={title}>
        <ImageOff size={22} />
        <span className={own.thumbName}>{isHeic(photo.content_type) ? 'Фото HEIC' : 'Не открывается'}</span>
        <button type="button" className={own.thumbAction} onClick={() => saveBlob(file.blob, fileName)}>
          <Download size={14} />
          Скачать
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={own.thumb}
      title={title}
      aria-label={`${label}: открыть крупно`}
      onClick={() => onOpen({ ...file, label, fileName })}
    >
      <img className={own.thumbImage} src={file.url} alt="" onError={() => setUnreadable(true)} />
    </button>
  );
};

interface PhotoViewerProps {
  photo: OpenedPhoto;
  onClose: () => void;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({ photo, onClose }) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    // Esc закрывает только фото: перехватываем раньше карточки жалобы (Modal слушает document)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  return createPortal(
    <div className={own.viewer} role="dialog" aria-modal="true" aria-label={photo.label} onClick={onClose}>
      <img className={own.viewerImage} src={photo.url} alt={photo.label} onClick={(e) => e.stopPropagation()} />
      <div className={own.viewerBar} onClick={(e) => e.stopPropagation()}>
        <span>{photo.label}</span>
        <button type="button" className={own.viewerButton} onClick={() => saveBlob(photo.blob, photo.fileName)}>
          <Download size={16} />
          Скачать
        </button>
        <button ref={closeRef} type="button" className={own.viewerButton} onClick={onClose}>
          <X size={16} />
          Закрыть
        </button>
      </div>
    </div>,
    document.body
  );
};

interface ComplaintPhotosProps {
  complaintId: string;
  photos: ComplaintPhoto[];
}

export const ComplaintPhotos: React.FC<ComplaintPhotosProps> = ({ complaintId, photos }) => {
  // номер попытки у каждого фото: новый key пересоздаёт миниатюру, и она качает файл заново
  const [attempts, setAttempts] = useState<Record<number, number>>({});
  const [opened, setOpened] = useState<OpenedPhoto | null>(null);
  const closeViewer = useCallback(() => setOpened(null), []);

  return (
    <>
      <div className={own.photos}>
        {photos.map((photo, index) => (
          <PhotoThumb
            key={`${photo.id}-${attempts[photo.id] || 0}`}
            complaintId={complaintId}
            photo={photo}
            index={index}
            onOpen={setOpened}
            onRetry={() => setAttempts((prev) => ({ ...prev, [photo.id]: (prev[photo.id] || 0) + 1 }))}
          />
        ))}
      </div>
      {opened && <PhotoViewer photo={opened} onClose={closeViewer} />}
    </>
  );
};
