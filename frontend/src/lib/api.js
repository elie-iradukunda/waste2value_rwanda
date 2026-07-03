const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:5000/api");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) })
};

export function normalizeMaterial(material) {
  const quantity = [material.quantity, material.unit].filter(Boolean).join(" ");
  return {
    ...material,
    quantity: quantity || material.quantity || "Pending",
    location: material.district || material.location || material.pickupAddress || "Kigali",
    status: String(material.status || "available").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  };
}
