import { useCallback, useEffect, useState } from "react";

export function useApiResource(loader, fallback, deps = []) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await loader();
      setData(payload);
    } catch (err) {
      setError(err.message || "Unable to load data");
      setData(fallback);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, setData, loading, error, reload: load };
}

export function useAction() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const run = async (action, successMessage = "Action completed") => {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const payload = await action();
      setMessage(payload.message || successMessage);
      return payload;
    } catch (err) {
      setError(err.message || "Action failed");
      return null;
    } finally {
      setBusy(false);
    }
  };

  return { busy, message, error, run, setMessage, setError };
}
