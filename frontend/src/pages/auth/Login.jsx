import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PublicLayout from "../../components/PublicLayout";
import { ActionButton, Alert, Panel, buttonIcons } from "../../components/dashboard/ui";
import { api } from "../../lib/api";
import { storeSession } from "../../hooks/useAuth";

const demoAccounts = [
  { value: "admin", label: "Admin", email: "admin@wastetovalue.rw" },
  { value: "industry", label: "Waste Producer", email: "industry@wastetovalue.rw" },
  { value: "buyer", label: "Recycler / SME", email: "buyer@wastetovalue.rw" },
  { value: "transporter", label: "Transport Provider", email: "transport@wastetovalue.rw" },
  { value: "regulator", label: "COPED / Waste Operator", email: "regulator@wastetovalue.rw" }
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function useDemoAccount(account) {
    setForm({ email: account.email, password: "demo123" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = await api.post("/auth/login", form);
      storeSession(payload.user, payload.token);
      navigate(location.state?.from || payload.redirectTo || "/admin");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-[520px]">
        <Panel title="Login">
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Alert tone="red">{error}</Alert>
            <input name="email" value={form.email} onChange={updateField} className="h-12 rounded-lg border border-line bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-brand-500" placeholder="Email" type="email" required />
            <input name="password" value={form.password} onChange={updateField} className="h-12 rounded-lg border border-line bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-brand-500" placeholder="Password" type="password" required />
            <ActionButton icon={buttonIcons.check} disabled={busy}>{busy ? "Logging in..." : "Login"}</ActionButton>
          </form>
          <div className="mt-6 rounded-lg bg-brand-50 p-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-brand-700">Demo accounts</p>
            <div className="mt-3 grid gap-2">
              {demoAccounts.map((account) => (
                <button key={account.value} type="button" onClick={() => useDemoAccount(account)} className="rounded-md bg-white px-3 py-2 text-left text-xs font-bold text-ink hover:text-brand-700">
                  {account.label}: {account.email} / demo123
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 flex justify-between gap-4 text-sm font-bold">
            <Link to="/forgot-password" className="text-brand-700">Forgot password</Link>
            <Link to="/register" className="text-brand-700">Create account</Link>
          </div>
        </Panel>
      </div>
    </PublicLayout>
  );
}
