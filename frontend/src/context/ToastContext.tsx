import React, { useCallback, useState, createContext } from 'react';
import Toast from '../components/Toast';
import type { ToastProps } from '../components/Toast';
import { v4 as uuidv4 } from 'uuid';

interface ToastContextType {
  showToast: (message: string, type: ToastProps['type'], duration?: number) => void;
}

export const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback((message: string, type: ToastProps['type'], duration = 5000) => {
    const id = uuidv4();
    setToasts((prevToasts) => [...prevToasts, { id, message, type, duration, onClose: removeToast }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
