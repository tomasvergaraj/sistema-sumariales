import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  type: NotificationType;
  message: string;
  onClose: () => void;
  duration?: number;
}

const Notification = ({ type, message, onClose, duration = 5000 }: NotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Esperar la animación de salida
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "flex items-center p-4 mb-4 text-sm border rounded-lg transition-all duration-300";

    switch (type) {
      case 'success':
        return `${baseStyles} text-green-800 border-green-300 bg-green-50`;
      case 'error':
        return `${baseStyles} text-red-800 border-red-300 bg-red-50`;
      case 'warning':
        return `${baseStyles} text-yellow-800 border-yellow-300 bg-yellow-50`;
      case 'info':
        return `${baseStyles} text-blue-800 border-blue-300 bg-blue-50`;
    }
  };

  return (
    <div
      className={`${getStyles()} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
      role="alert"
    >
      {getIcon()}
      <span className="sr-only">{type}:</span>
      <div className="ml-3 font-medium">{message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 hover:bg-gray-200 focus:ring-2 focus:ring-gray-400"
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        aria-label="Cerrar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

interface NotificationContainerProps {
  notifications: Array<{
    id: string;
    type: NotificationType;
    message: string;
  }>;
  onRemove: (id: string) => void;
}

export const NotificationContainer = ({ notifications, onRemove }: NotificationContainerProps) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
};

// Hook para manejar notificaciones
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: NotificationType;
    message: string;
  }>>([]);

  const addNotification = (type: NotificationType, message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const success = (message: string) => addNotification('success', message);
  const error = (message: string) => addNotification('error', message);
  const warning = (message: string) => addNotification('warning', message);
  const info = (message: string) => addNotification('info', message);

  return {
    notifications,
    success,
    error,
    warning,
    info,
    removeNotification,
  };
};