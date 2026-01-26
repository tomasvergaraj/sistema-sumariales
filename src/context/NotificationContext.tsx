import { createContext, useContext, ReactNode } from 'react';
import { useNotifications, NotificationContainer } from '../components/Notification';
import { useConfirmDialog } from '../components/ConfirmDialog';

const NotificationContext = createContext<ReturnType<typeof useNotifications> & ReturnType<typeof useConfirmDialog> | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const notificationMethods = useNotifications();
  const confirmDialogMethods = useConfirmDialog();

  return (
    <NotificationContext.Provider value={{ ...notificationMethods, ...confirmDialogMethods }}>
      {children}
      <NotificationContainer
        notifications={notificationMethods.notifications}
        onRemove={notificationMethods.removeNotification}
      />
      <confirmDialogMethods.ConfirmDialogComponent />
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};