import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PublicLayout from "../../components/PublicLayout";
import { ActionButton, Alert, Panel, buttonIcons } from "../../components/dashboard/ui";
import { api } from "../../lib/api";

const roles = [
  { value: "admin", label: "Admin", email: "admin@waste2value.rw" },
  { value: "industry", label: "Waste Producer", email: "industry@waste2value.rw" },
  { value: "buyer", label: "Recycler / SME", email: "buyer@waste2value.rw" },
  { value: "transporter", label: "Transport Provider", email: "transport@waste2value.rw" },
  { value: "regulator", label: "COPED / Waste Operator", email: "regulator@waste2value.rw" }
];

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "admin@waste2value.rw", password: "demo123", role: "admin" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    if (name === "role") {
      const selectedRole = roles.find((role) => role.value === value);
      setForm((current) => ({ ...current, role: value, email: selectedRole?.email || current.email }));
      return;
    }

    setForm((current) => ({ ...current, [name]: value }));
  }

  function useDemoAccount(role) {
    setForm({ email: role.email, password: "demo123", role: role.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = await api.post("/auth/login", form);
      localStorage.setItem("w2v_user", JSON.stringify(payload.user));
      localStorage.setItem("w2v_token", payload.token);
      navigate(payload.redirectTo || "/admin");
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
            <input name="email" value={form.email} onChange={updateField} className="h-12 rounded-lg border border-line bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-brand-500" placeholder="Email" />
            <input name="password" value={form.password} onChange={updateField} className="h-12 rounded-lg border border-line bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-brand-500" placeholder="Password" type="password" />
            <select name="role" value={form.role} onChange={updateField} className="h-12 rounded-lg border border-line bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-brand-500">
              {roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
            </select>
            <ActionButton icon={buttonIcons.check} disabled={busy}>{busy ? "Logging in..." : "Login"}</ActionButton>
          </form>
          <div className="mt-6 rounded-lg bg-brand-50 p-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-brand-700">Demo accounts</p>
            <div className="mt-3 grid gap-2">
              {roles.map((role) => (
                <button key={role.value} type="button" onClick={() => useDemoAccount(role)} className="rounded-md bg-white px-3 py-2 text-left text-xs font-bold text-ink hover:text-brand-700">
                  {role.label}: {role.email} / demo123
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
