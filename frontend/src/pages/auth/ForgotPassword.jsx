import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PublicLayout from "../../components/PublicLayout";
import { ActionButton, Alert, Panel, buttonIcons } from "../../components/dashboard/ui";
import { api } from "../../lib/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("request");
  const [form, setForm] = useState({ email: "", code: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function requestCode(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload = await api.post("/auth/forgot-password", { email: form.email });
      setForm((current) => ({ ...current, code: payload.resetCode }));
      setMessage(`${payload.message} Reset code: ${payload.resetCode}`);
      setStep("reset");
    } catch (err) {
      setError(err.message || "Could not generate a reset code");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload = await api.post("/auth/reset-password", form);
      setMessage(payload.message);
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(err.message || "Could not reset password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-[520px]">
        <Panel title="Forgot Password">
          <Alert>{message}</Alert>
          <Alert tone="red">{error}</Alert>
          {step === "request" ? (
            <form className="grid gap-4" onSubmit={requestCode}>
              <input name="email" value={form.email} onChange={updateField} className="h-12 rounded-lg border border-line bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-brand-500" placeholder="Email address" type="email" required />
              <ActionButton icon={buttonIcons.send} disabled={busy}>{busy ? "Sending..." : "Send Reset Code"}</ActionButton>
            </form>
          ) : (
            <form className="grid gap-4" onSubmit={resetPassword}>
              <input name="email" value={form.email} onChange={updateField} className="h-12 rounded-lg border border-line bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-brand-500" placeholder="Email address" type="email" required />
              <input name="code" value={form.code} onChange={updateField} className="h-12 rounded-lg border border-line bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-brand-500" placeholder="6-digit reset code" required />
              <input name="newPassword" value={form.newPassword} onChange={updateField} className="h-12 rounded-lg border border-line bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-brand-500" placeholder="New password" type="password" required minLength={6} />
              <ActionButton icon={buttonIcons.check} disabled={busy}>{busy ? "Resetting..." : "Reset Password"}</ActionButton>
            </form>
          )}
          <div className="mt-6 text-sm font-bold">
            <Link to="/login" className="text-brand-700">Back to login</Link>
          </div>
        </Panel>
      </div>
    </PublicLayout>
  );
}
