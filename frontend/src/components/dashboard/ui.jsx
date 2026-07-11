import { CheckCircle2, Download, Filter, QrCode, Search, Send, Upload } from "lucide-react";

export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const tones = {
  green: "bg-brand-600",
  blue: "bg-signal-blue",
  orange: "bg-signal-orange",
  red: "bg-signal-red"
};

const softTones = {
  green: "bg-brand-50 text-brand-700",
  blue: "bg-blue-50 text-signal-blue",
  orange: "bg-amber-50 text-signal-orange",
  red: "bg-red-50 text-signal-red",
  gray: "bg-slate-100 text-slate-600"
};

export function SearchBox({ placeholder = "Search materials, companies, certificates..." }) {
  return (
    <div className="relative w-full max-w-[330px]">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        className="h-11 w-full rounded-lg border border-line bg-white pl-11 pr-4 text-sm text-ink shadow-subtle outline-none transition focus:border-brand-500"
        placeholder={placeholder}
      />
    </div>
  );
}

export function Panel({ title, action, children, className }) {
  return (
    <section className={cx("rounded-lg border border-line bg-panel p-6 shadow-subtle", className)}>
      {(title || action) && (
        <div className="mb-6 flex items-center justify-between gap-4">
          {title && <h2 className="text-xl font-extrabold leading-tight text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function LoadingState({ label = "Loading Waste-to-Value data..." }) {
  return (
    <div className="rounded-lg border border-line bg-white p-6 text-sm font-bold text-muted shadow-subtle">
      {label}
    </div>
  );
}

export function Alert({ children, tone = "green" }) {
  if (!children) return null;

  const styles = {
    green: "border-brand-200 bg-brand-50 text-brand-700",
    orange: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
    blue: "border-blue-200 bg-blue-50 text-signal-blue"
  };

  return (
    <div className={cx("rounded-lg border px-4 py-3 text-sm font-bold", styles[tone] || styles.green)}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, detail, tone = "green" }) {
  return (
    <article className="min-h-[104px] rounded-lg border border-line bg-panel p-4 shadow-subtle">
      <div className="flex items-start gap-4">
        <div className={cx("h-10 w-10 shrink-0 rounded-lg", tones[tone])} />
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted">{label}</p>
          <p className="mt-1 text-2xl font-extrabold leading-none text-ink">{value}</p>
        </div>
      </div>
      {detail && <p className="mt-4 text-xs font-medium text-muted">{detail}</p>}
    </article>
  );
}

export function StatGrid({ stats }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}

export function ActionButton({ children, variant = "primary", icon, className, ...props }) {
  const variants = {
    primary: "border-brand-600 bg-brand-600 text-white hover:bg-brand-700",
    outline: "border-brand-600 bg-white text-brand-700 hover:bg-brand-50",
    blue: "border-blue-50 bg-blue-50 text-signal-blue hover:bg-blue-100",
    ghost: "border-transparent bg-transparent text-brand-700 hover:bg-brand-50"
  };
  const Icon = icon;

  return (
    <button
      className={cx("focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-6 text-sm font-extrabold transition", variants[variant], className)}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}

export function StatusPill({ children, tone = "green" }) {
  return (
    <span className={cx("inline-flex min-w-[92px] items-center justify-center rounded-lg px-4 py-2 text-xs font-extrabold", softTones[tone] || softTones.gray)}>
      {children}
    </span>
  );
}

export function ProgressBar({ label, value, max = 100 }) {
  const width = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className="grid grid-cols-[150px_1fr_44px] items-center gap-4 text-sm max-sm:grid-cols-1 max-sm:gap-2">
      <span className="font-semibold text-ink">{label}</span>
      <div className="h-4 overflow-hidden bg-slate-200">
        <div className="h-full bg-brand-600" style={{ width: `${width}%` }} />
      </div>
      <span className="text-right text-xs font-semibold text-muted max-sm:text-left">{value}%</span>
    </div>
  );
}

export function DataTable({ columns, rows, selectedId, onSelectRow }) {
  const selectable = typeof onSelectRow === "function";

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[660px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs font-bold text-muted">
            {columns.map((column) => (
              <th key={column.key} className="pb-3 pr-6">{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const isSelected = selectable && row.id !== undefined && row.id === selectedId;
            return (
              <tr
                key={`${rowIndex}-${Object.values(row)[0]}`}
                onClick={selectable ? () => onSelectRow(row) : undefined}
                className={cx(
                  "border-b border-slate-100 last:border-0",
                  selectable && "cursor-pointer",
                  isSelected && "bg-brand-50"
                )}
              >
                {columns.map((column) => (
                  <td key={column.key} className="py-4 pr-6 font-semibold text-ink">
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {selectable && <p className="mt-3 text-xs font-semibold text-muted">Click a row to select it, then use a Quick Action.</p>}
    </div>
  );
}

export function BarChart({ data }) {
  return (
    <div className="flex h-44 items-end justify-between gap-5 px-4 pt-3">
      {data.map((item) => (
        <div key={item.label} className="flex h-full flex-1 flex-col items-center justify-end gap-3">
          <div className="w-full max-w-[42px] bg-brand-600" style={{ height: `${item.value}%` }} />
          <span className="text-xs font-semibold text-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function LineChart({ data }) {
  const max = Math.max(...data.map((item) => item.value));
  const points = data
    .map((item, index) => {
      const x = 12 + index * (276 / Math.max(1, data.length - 1));
      const y = 160 - (item.value / max) * 130;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="h-[330px] w-full">
      <svg viewBox="0 0 320 210" className="h-full w-full" role="img" aria-label="Waste supply forecast">
        <line x1="12" x2="300" y1="180" y2="180" stroke="#dfe5e8" strokeWidth="1.5" />
        <line x1="12" x2="12" y1="24" y2="180" stroke="#dfe5e8" strokeWidth="1.5" />
        <polyline points={points} fill="none" stroke="#178845" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((item, index) => {
          const x = 12 + index * (276 / Math.max(1, data.length - 1));
          const y = 160 - (item.value / max) * 130;
          return <circle key={item.label} cx={x} cy={y} r="4.5" fill="#178845" />;
        })}
        {data.map((item, index) => {
          const x = 12 + index * (276 / Math.max(1, data.length - 1));
          return <text key={item.label} x={x} y="204" textAnchor="middle" className="fill-slate-500 text-[9px] font-bold">{item.label}</text>;
        })}
      </svg>
    </div>
  );
}

export function RouteMap() {
  return (
    <div className="rounded-lg bg-brand-50 p-6">
      <svg viewBox="0 0 320 220" className="h-[250px] w-full" role="img" aria-label="Optimized delivery route">
        <polyline points="58,70 150,132 255,190" fill="none" stroke="#178845" strokeWidth="5" strokeLinecap="round" />
        <circle cx="58" cy="70" r="10" fill="#178845" />
        <circle cx="150" cy="132" r="10" fill="#178845" />
        <circle cx="255" cy="190" r="10" fill="#f59e0b" />
        <text x="72" y="75" className="fill-ink text-[12px] font-bold">Pickup</text>
        <text x="164" y="137" className="fill-ink text-[12px] font-bold">Stop</text>
        <text x="269" y="195" className="fill-ink text-[12px] font-bold">Delivery</text>
      </svg>
    </div>
  );
}

export function QrPattern() {
  const blocks = [
    [1, 1],
    [4, 1],
    [2, 3],
    [5, 3],
    [3, 5],
    [6, 5]
  ];

  return (
    <div className="grid h-28 w-28 grid-cols-7 grid-rows-7 border-4 border-ink bg-white p-1">
      {Array.from({ length: 49 }).map((_, index) => {
        const x = (index % 7) + 1;
        const y = Math.floor(index / 7) + 1;
        const filled = blocks.some(([bx, by]) => bx === x && by === y);
        return <span key={index} className={filled ? "bg-ink" : "bg-white"} />;
      })}
    </div>
  );
}

export function MaterialRow({ material, showMatch = true }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-0 max-sm:items-start">
      <div className="min-w-0">
        <h3 className="truncate text-lg font-extrabold text-ink">{material.title}</h3>
        <p className="mt-1 text-xs font-semibold text-muted">{material.location} - {material.quantity} - {material.price}</p>
      </div>
      {showMatch ? <StatusPill>{material.match}% match</StatusPill> : <StatusPill tone={material.status === "Requested" ? "orange" : "green"}>{material.status}</StatusPill>}
    </div>
  );
}

export function ActionModal({ open, title, details = [], noteRequired = false, noteLabel = "Note (optional)", notePlaceholder, confirmLabel = "Confirm", onConfirm, onCancel, readOnly = false }) {
  if (!open) return null;

  function handleSubmit(event) {
    event.preventDefault();
    const note = new FormData(event.target).get("note") || "";
    if (noteRequired && !note.trim()) return;
    onConfirm(note.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div
        className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-lg bg-white p-8 shadow-subtle"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-xl font-extrabold text-ink">{title}</h2>

        <dl className="mt-6 grid gap-4 border-t border-line pt-6">
          {details.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[160px_1fr] gap-4">
              <dt className="text-xs font-extrabold uppercase tracking-wide text-muted">{label}</dt>
              <dd className="text-sm font-semibold text-ink">{value ?? "-"}</dd>
            </div>
          ))}
        </dl>

        {readOnly ? (
          <div className="mt-8 flex justify-end">
            <ActionButton variant="outline" onClick={onCancel}>Close</ActionButton>
          </div>
        ) : (
          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-xs font-extrabold text-muted">{noteLabel}{noteRequired ? " (required)" : ""}</span>
              <textarea
                name="note"
                required={noteRequired}
                rows={3}
                className="rounded-lg border border-line bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-500"
                placeholder={notePlaceholder || (noteRequired ? "Explain why, so there is a record of this decision..." : "Add a note about this decision...")}
              />
            </label>
            <div className="flex justify-end gap-3">
              <ActionButton type="button" variant="outline" onClick={onCancel}>Cancel</ActionButton>
              <ActionButton type="submit">{confirmLabel}</ActionButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export const buttonIcons = {
  download: Download,
  qr: QrCode,
  send: Send,
  upload: Upload,
  check: CheckCircle2,
  filter: Filter
};
