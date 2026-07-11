import DashboardShell from "./DashboardShell";
import { useEffect, useState } from "react";
import { ActionButton, ActionModal, Alert, DataTable, Panel, buttonIcons } from "./ui";

function describeRow(row) {
  if (!row) return "";
  return row.material || row.name || row.job || row.number || row.email || (row.id !== undefined ? `#${row.id}` : "");
}

const HIDDEN_DETAIL_KEYS = new Set(["id", "rawQuantity", "companyVerificationStatus"]);

function humanizeKey(key) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

function rowToDetails(row, columns) {
  if (!row) return [];
  const labelByKey = Object.fromEntries(columns.map((c) => [c.key, c.label]));
  return Object.entries(row)
    .filter(([key, value]) => !HIDDEN_DETAIL_KEYS.has(key) && value !== undefined && value !== null && value !== "")
    .map(([key, value]) => [labelByKey[key] || humanizeKey(key), value]);
}

const REASON_REQUIRED_PREFIXES = ["Reject", "Suspend"];
const SKIP_MODAL_PREFIXES = ["View", "Print"];

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
  mapRowToForm,
  isActionDisabled,
  noteConfig,
  message,
  error,
  busy = false,
  searchable = false,
  searchPlaceholder = "Search..."
}) {
  const [form, setForm] = useState({});
  const [searchText, setSearchText] = useState("");
  const [selectedId, setSelectedId] = useState(rows[0]?.id);
  const [pendingAction, setPendingAction] = useState(null);
  const [viewRow, setViewRow] = useState(null);

  const visibleRows = searchable && searchText.trim()
    ? rows.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(searchText.trim().toLowerCase())))
    : rows;

  useEffect(() => {
    if (!visibleRows.some((row) => row.id === selectedId)) {
      setSelectedId(visibleRows[0]?.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleRows]);

  const selectedRow = visibleRows.find((row) => row.id === selectedId) || visibleRows[0] || {};

  useEffect(() => {
    if (mapRowToForm && selectedRow.id !== undefined) {
      setForm(mapRowToForm(selectedRow));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRow.id]);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function openAction(action) {
    if (SKIP_MODAL_PREFIXES.some((prefix) => action.startsWith(prefix))) {
      onAction?.(action, selectedRow, "");
      return;
    }
    setPendingAction(action);
  }

  function confirmAction(note) {
    onAction?.(pendingAction, selectedRow, note);
    setPendingAction(null);
  }

  async function submitForm(event) {
    event.preventDefault();
    if (!onSubmit) return;
    const completed = await onSubmit(form, selectedRow);
    if (completed) setForm({});
  }

  const hasSidePanel = actions.length > 0 || formFields.length > 0;
  const customNote = pendingAction ? noteConfig?.(pendingAction) : null;
  const reasonRequired = customNote ? Boolean(customNote.required) : (pendingAction ? REASON_REQUIRED_PREFIXES.some((prefix) => pendingAction.startsWith(prefix)) : false);

  return (
    <DashboardShell title={title} userRole={role} active={active}>
      <div className={`grid gap-6 ${hasSidePanel ? "xl:grid-cols-[1fr_340px]" : ""}`}>
        <Panel
          title={title}
          action={<ActionButton variant="outline" className="h-9 px-4 text-xs" disabled={!visibleRows.length} onClick={() => setViewRow(selectedRow)}>View full details</ActionButton>}
          className="min-w-0"
        >
          <div className="mb-4 grid gap-3">
            <Alert>{message}</Alert>
            <Alert tone="red">{error}</Alert>
          </div>
          {searchable && (
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder={searchPlaceholder}
              className="mb-4 h-11 w-full rounded-lg border border-line bg-slate-50 px-4 text-sm outline-none focus:border-brand-500"
            />
          )}
          <DataTable columns={columns} rows={visibleRows} selectedId={selectedRow.id} onSelectRow={(row) => setSelectedId(row.id)} />
        </Panel>

        {(actions.length > 0 || formFields.length > 0) && (
          <Panel title="Quick Actions">
            {actions.length > 0 && (
              <div className="grid gap-3">
                {visibleRows.length > 0 && (
                  <p className="-mt-1 mb-1 text-xs font-bold text-brand-700">
                    Selected: {describeRow(selectedRow)}
                  </p>
                )}
                {actions.map((action) => {
                  const unavailable = Boolean(isActionDisabled?.(action, selectedRow));
                  return (
                    <ActionButton
                      key={action}
                      icon={buttonIcons.check}
                      variant="outline"
                      className="w-full justify-start"
                      disabled={busy || !visibleRows.length || unavailable}
                      title={unavailable ? "Not applicable to the selected row" : undefined}
                      onClick={() => openAction(action)}
                    >
                      {action}
                    </ActionButton>
                  );
                })}
              </div>
            )}
            {formFields.length > 0 && (
              <form className="mt-6 grid gap-4" onSubmit={submitForm}>
                {mapRowToForm && (
                  <p className="-mt-2 text-xs font-bold text-brand-700">
                    Editing: {selectedRow.material || selectedRow.name || `#${selectedRow.id}`}
                  </p>
                )}
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
          </Panel>
        )}
      </div>

      <ActionModal
        open={Boolean(pendingAction)}
        title={`${pendingAction || ""} — ${describeRow(selectedRow)}`}
        details={rowToDetails(selectedRow, columns)}
        noteRequired={reasonRequired}
        noteLabel={customNote?.label || (reasonRequired ? "Reason" : "Note (optional)")}
        notePlaceholder={customNote?.placeholder}
        confirmLabel={pendingAction || "Confirm"}
        onConfirm={confirmAction}
        onCancel={() => setPendingAction(null)}
      />

      <ActionModal
        open={Boolean(viewRow)}
        title={describeRow(viewRow) || "Details"}
        details={rowToDetails(viewRow, columns)}
        readOnly
        onCancel={() => setViewRow(null)}
      />
    </DashboardShell>
  );
}
