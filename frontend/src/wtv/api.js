const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const SESSION_KEY = "wtv_session";

export function readSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
  }
}

export function storeSession(session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = {};
  const options = { method, headers };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, options);
  const text = await response.text();
  let payload = {};

  try {
    payload = text ? JSON.parse(text) : {};
  } catch (_error) {
    payload = { message: text };
  }

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Request failed with HTTP ${response.status}`);
  }

  return payload;
}

export function createApi(token) {
  return {
    get: (path) => apiRequest(path, { token }),
    post: (path, body) => apiRequest(path, { method: "POST", body, token }),
    patch: (path, body) => apiRequest(path, { method: "PATCH", body, token }),
    delete: (path) => apiRequest(path, { method: "DELETE", token })
  };
}
