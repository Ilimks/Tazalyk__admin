import { useNotificationStore } from '@/store/notification.store';
import { Notification } from './Notification';
import styles from './NotificationContainer.module.scss';

export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className={styles.container}>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          {...notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};