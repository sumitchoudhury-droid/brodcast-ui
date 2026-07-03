import { useEffect } from "react";
import { useToast } from "../hooks/useToast";
import { setToast } from "../api/api.jsx";

export function QueryErrorHandler() {
  const toast = useToast();

  useEffect(() => {
    setToast(toast);
    return () => setToast(null);
  }, [toast]);

  return null;
}
