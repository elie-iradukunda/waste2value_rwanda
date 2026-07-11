import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PublicLayout from "../../components/PublicLayout";
import { ActionButton, Alert, Panel, buttonIcons } from "../../components/dashboard/ui";
import { api } from "../../lib/api";
import { storeSession } from "../../hooks/useAuth";

const roleOptions = [
  { value: "industry", label: "Waste Producer" },
  { value: "buyer", label: "Recycler / SME" },
  { value: "transporter", label: "Transport Provider" },
  { value: "regulator", label: "COPED / Waste Operator" }
];

const fields = [
  ["fullName", "Full name"],
  ["email", "Email"],
  ["phone", "Phone number"],
  ["password", "Password"],
  ["companyName", "Company name"],
  ["district", "District"],
  ["sector", "Sector"],
  ["businessCategory", "Business category"],
  ["tin", "TIN optional"],
  ["licenseDocument", "License document optional"]
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ role: "industry" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const payload = await api.post("/auth/register", form);
      setMessage(payload.message);
      storeSession(payload.user, payload.token);
      setTimeout(() => navigate(payload.redirectTo || "/login"), 900);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicLayout>
      <Panel title="Register Company">
        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="md:col-span-2">
            <Alert>{message}</Alert>
            <Alert tone="red">{error}</Alert>
          </div>
          {fields.map(([name, field]) => (
            <input
              key={field}
              name={name}
              value={form[name] || ""}
              onChange={updateField}
              className="h-12 rounded-lg border border-line bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-brand-500"
              placeholder={field}
              type={field === "Password" ? "password" : "text"}
            />
          ))}
          <select name="role" value={form.role} onChange={updateField} className="h-12 rounded-lg border border-line bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-brand-500">
            {roleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
          </select>
          <ActionButton icon={buttonIcons.send} className="md:col-span-2" disabled={busy}>{busy ? "Submitting..." : "Submit Registration"}</ActionButton>
        </form>
      </Panel>
    </PublicLayout>
  );
}
