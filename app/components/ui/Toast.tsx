import { useEffect, useState } from "react";
import styles from "./toast.module.css";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose?: () => void;
}

export default function Toast({
  message,
  type = "success",
  duration = 2000,
  onClose,
}: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hideTimer = setTimeout(() => setVisible(false), duration);
    const removeTimer = setTimeout(() => {
      if (onClose) onClose();
    }, duration + 1000);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [duration, onClose]);

  return (
    <div
      className={`${styles.toast} ${styles[type]} ${
        !visible ? styles.hidden : ""
      }`}
      role="alert"
    >
      {message}
    </div>
  );
}
