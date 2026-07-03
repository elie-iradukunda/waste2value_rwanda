import { useState } from "react";
import DashboardShell from "../components/dashboard/DashboardShell";
import { ActionButton, Alert, Panel, buttonIcons } from "../components/dashboard/ui";

export default function Settings({ role = "admin" }) {
  const [message, setMessage] = useState("");

  return (
    <DashboardShell title="Settings" userRole={role} active="Settings">
      <div className="grid gap-7 xl:grid-cols-2">
        <Panel title="Platform Settings">
          <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); setMessage("Settings saved for this demo session."); }}>
            <Alert>{message}</Alert>
            {["Company name", "Email notifications", "Default district", "Certificate prefix"].map((field) => (
              <label key={field} className="grid gap-2">
                <span className="text-xs font-extrabold text-muted">{field}</span>
                <input className="h-11 rounded-lg border border-line bg-slate-50 px-4 text-sm outline-none focus:border-brand-500" placeholder={field} />
              </label>
            ))}
            <ActionButton icon={buttonIcons.check}>Save Settings</ActionButton>
          </form>
        </Panel>
        <Panel title="Verification Rules">
          <div className="grid gap-4 text-sm font-semibold text-ink">
            {["Company profile must include district and sector", "Transport providers upload license document", "Completed exchanges generate certificate proof", "Suspicious categories require partner review"].map((rule) => (
              <p key={rule} className="rounded-lg bg-brand-50 p-4">{rule}</p>
            ))}
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}
