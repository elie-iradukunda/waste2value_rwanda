import DashboardShell from "./DashboardShell";
import { useState } from "react";
import { ActionButton, Alert, DataTable, Panel, StatusPill, buttonIcons } from "./ui";

export default function ManagementPage({
  title,
  role = "admin",
  active = "Dashboard",
  columns,
  rows,
  formFields = [],
  actions = [],
  onAction,
  onSubmit,
  message,
  error,
  busy = false
}) {
  const [form, setForm] = useState({});

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submitForm(event) {
    event.preventDefault();
    if (!onSubmit) return;
    const completed = await onSubmit(form);
    if (completed) setForm({});
  }

  return (
    <DashboardShell title={title} userRole={role} active={active}>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Panel
          title={title}
          action={actions.length ? <ActionButton variant="outline" icon={buttonIcons.filter}>Filter</ActionButton> : null}
          className="min-w-0"
        >
          <div className="mb-4 grid gap-3">
            <Alert>{message}</Alert>
            <Alert tone="red">{error}</Alert>
          </div>
          <DataTable columns={columns} rows={rows} />
        </Panel>

        <Panel title="Quick Actions">
          <div className="grid gap-3">
            {actions.map((action) => (
              <ActionButton key={action} icon={buttonIcons.check} variant="outline" className="w-full justify-start" disabled={busy} onClick={() => onAction?.(action)}>
                {action}
              </ActionButton>
            ))}
          </div>
          {formFields.length > 0 && (
            <form className="mt-6 grid gap-4" onSubmit={submitForm}>
              {formFields.map((field) => (
                <label key={field} className="grid gap-2">
                  <span className="text-xs font-extrabold text-muted">{field}</span>
                  <input
                    name={field.toLowerCase().replaceAll(" ", "_").replaceAll("/", "_")}
                    value={form[field.toLowerCase().replaceAll(" ", "_").replaceAll("/", "_")] || ""}
                    onChange={updateField}
                    className="h-11 rounded-lg border border-line bg-slate-50 px-4 text-sm outline-none focus:border-brand-500"
                    placeholder={field}
                  />
                </label>
              ))}
              <ActionButton icon={buttonIcons.send} disabled={busy}>{busy ? "Submitting..." : "Submit"}</ActionButton>
            </form>
          )}
          {!formFields.length && (
            <div className="mt-6 grid gap-3">
              <StatusPill>Verified</StatusPill>
              <StatusPill tone="orange">Pending</StatusPill>
              <StatusPill tone="blue">In review</StatusPill>
            </div>
          )}
        </Panel>
      </div>
    </DashboardShell>
  );
}
