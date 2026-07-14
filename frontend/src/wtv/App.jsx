import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest, clearSession, createApi, readSession, storeSession } from "./api.js";
import Login from "./Login.jsx";
import Shell from "./Shell.jsx";
import AdminPage from "./AdminPage.jsx";
import ProducerPage from "./ProducerPage.jsx";
import RecyclerPage from "./RecyclerPage.jsx";
import TransportPage from "./TransportPage.jsx";

async function loadDashboard(api, role) {
  switch (String(role || "").toUpperCase()) {
    case "ADMIN": {
      const [reports, pendingCompanies, pendingListings, categories] = await Promise.all([
        api.get("/admin/reports"),
        api.get("/admin/companies/pending"),
        api.get("/admin/listings/pending"),
        api.get("/admin/categories")
      ]);
      return { reports, pendingCompanies, pendingListings, categories };
    }
    case "PRODUCER": {
      const [categories, listings, requests, certificates, transportStaff] = await Promise.all([
        api.get("/categories"),
        api.get("/listings/mine"),
        api.get("/producer/requests"),
        api.get("/producer/certificates"),
        api.get("/producer/transport-staff")
      ]);
      return { categories, listings, requests, certificates, transportStaff };
    }
    case "RECYCLER": {
      const [categories, marketplace, requests, certificates] = await Promise.all([
        api.get("/categories"),
        api.get("/marketplace"),
        api.get("/requests/mine"),
        api.get("/recycler/certificates")
      ]);
      return { categories, marketplace, requests, certificates };
    }
    case "TRANSPORT": {
      const [jobs] = await Promise.all([
        api.get("/transport/jobs")
      ]);
      return { jobs };
    }
    default:
      throw new Error("Unsupported account role");
  }
}

export default function App() {
  const [session, setSession] = useState(() => readSession());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(session));
  const [authBusy, setAuthBusy] = useState(false);
  const [error, setError] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const timerRef = useRef(null);

  const token = session?.token;
  const api = useMemo(() => (token ? createApi(token) : null), [token]);

  const toast = useCallback((message) => {
    setToastMsg(message);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setToastMsg(""), 2800);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    setData(null);
    setError("");
  }, []);

  const refresh = useCallback(async () => {
    if (!api || !token) return;
    setLoading(true);
    setError("");

    try {
      const freshUser = await api.get("/me");
      setSession((current) => {
        if (!current) return current;
        const nextSession = { ...current, user: normalizeUser(freshUser) };
        storeSession(nextSession);
        return nextSession;
      });
      const dashboard = await loadDashboard(api, freshUser.role);
      setData(dashboard);
    } catch (err) {
      setError(err.message || "Could not load dashboard data");
      if (/token|auth/i.test(err.message || "")) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [api, logout, token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function login(credentials) {
    setAuthBusy(true);
    setError("");

    try {
      const auth = await apiRequest("/auth/login", { method: "POST", body: credentials });
      const nextSession = { token: auth.token, user: normalizeUser(auth.user) };
      storeSession(nextSession);
      setSession(nextSession);
      setData(null);
      toast(`Logged in as ${auth.user.name}`);
    } finally {
      setAuthBusy(false);
    }
  }

  async function registerCompany(details) {
    setAuthBusy(true);
    setError("");

    try {
      const auth = await apiRequest("/auth/register", { method: "POST", body: details });
      const nextSession = { token: auth.token, user: normalizeUser(auth.user) };
      storeSession(nextSession);
      setSession(nextSession);
      setData(null);
      toast(auth.user.role === "RECYCLER"
        ? "Recycler account registered. You can request approved materials now."
        : "Producer company registered. Admin approval is required before listing materials.");
    } finally {
      setAuthBusy(false);
    }
  }

  if (!session) {
    return <Login onLogin={login} onRegister={registerCompany} busy={authBusy} />;
  }

  const role = String(session.user.role || "").toUpperCase();
  const pageProps = { api, data: data || {}, refresh, toast, user: session.user };

  return (
    <Shell user={session.user} onLogout={logout}>
      {error && (
        <div className="notice error-panel">
          <div>
            <b>Backend connection issue</b>
            <span>{error}</span>
          </div>
          <button className="btn ghost sm" onClick={refresh}>Retry</button>
        </div>
      )}

      {loading && !data ? (
        <div className="page">
          <div className="empty">
            <b>Loading dashboard</b>
            Connecting to the Waste-to-Value backend.
          </div>
        </div>
      ) : (
        <>
          {role === "ADMIN" && <AdminPage {...pageProps} />}
          {role === "PRODUCER" && <ProducerPage {...pageProps} />}
          {role === "RECYCLER" && <RecyclerPage {...pageProps} />}
          {role === "TRANSPORT" && <TransportPage {...pageProps} />}
        </>
      )}

      {toastMsg && <div className="toast">{toastMsg}</div>}
    </Shell>
  );
}

function normalizeUser(user) {
  return { ...user, role: String(user?.role || "").toUpperCase() };
}
