import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo
} from "react";
import ReactDOM from "react-dom";
import ReusableToast from "../../src/reusableComponents/reusableToast";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, title, message, duration = 7000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [
      ...prevToasts,
      { id, type, title, message, duration }
    ]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const toast = useMemo(
    () => ({
      success: (title, message, duration) =>
        addToast("success", title, message, duration),
      error: (title, message, duration) =>
        addToast("error", title, message, duration),
      warning: (title, message, duration) =>
        addToast("warning", title, message, duration)
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {ReactDOM.createPortal(
        <div className="toastWrapper">
          {toasts.map((t) => (
            <ReusableToast
              key={t.id}
              type={t.type}
              title={t.title}
              message={t.message}
              duration={t.duration}
              onClose={() => removeToast(t.id)}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
