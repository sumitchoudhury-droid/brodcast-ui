import { useEffect, useState } from "react";
import { initAuth } from "../api/api.jsx";
import { useToast } from "../hooks/useToast";

export function AuthBootstrap({ children }) {
  const toast = useToast();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    initAuth()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
        toast?.error("Authentication failed", err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  if (error)
    return (
      <div style={{ padding: 16 }}>Authentication failed: {error.message}</div>
    );
  if (!ready) return null;
  return children;
}
