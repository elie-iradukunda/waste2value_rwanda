import { useCallback, useEffect, useState } from "react";

function readUser() {
  try {
    const raw = localStorage.getItem("wtv_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStoredUser() {
  return readUser();
}

export function getStoredToken() {
  return localStorage.getItem("wtv_token") || null;
}

export function storeSession(user, token) {
  localStorage.setItem("wtv_user", JSON.stringify(user));
  localStorage.setItem("wtv_token", token);
  window.dispatchEvent(new Event("wtv-auth-change"));
}

export function clearSession() {
  localStorage.removeItem("wtv_user");
  localStorage.removeItem("wtv_token");
  window.dispatchEvent(new Event("wtv-auth-change"));
}

export function useAuth() {
  const [user, setUser] = useState(readUser);

  const sync = useCallback(() => setUser(readUser()), []);

  useEffect(() => {
    window.addEventListener("wtv-auth-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("wtv-auth-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  const logout = useCallback(() => {
    clearSession();
  }, []);

  return { user, role: user?.role || null, isAuthenticated: Boolean(user), logout };
}
