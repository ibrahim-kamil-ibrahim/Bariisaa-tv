import { Snackbar, Alert } from '@mui/material';
import { useNotificationStore } from '../store/notificationStore';

export default function NotificationProvider() {
  const notifications = useNotificationStore((s) => s.notifications);
  const removeNotification = useNotificationStore((s) => s.removeNotification);

  if (notifications.length === 0) return null;

  const latest = notifications[notifications.length - 1];

  return (
    <Snackbar
      open
      autoHideDuration={latest.type === 'error' ? 6000 : 3000}
      onClose={() => removeNotification(latest.id)}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={() => removeNotification(latest.id)}
        severity={latest.type}
        variant="filled"
        sx={{ width: '100%', maxWidth: 400 }}
      >
        {latest.message}
      </Alert>
    </Snackbar>
  );
}
