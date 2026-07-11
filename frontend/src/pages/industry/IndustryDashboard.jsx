import { useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import { ActionButton, Alert, LoadingState, Panel, StatGrid, buttonIcons } from "../../components/dashboard/ui";
import { useAction, useApiResource } from "../../hooks/useApi";
import { api } from "../../lib/api";

export default function IndustryDashboard() {
  const [form, setForm] = useState({ category: "Plastic", unit: "kg", district: "Gasabo", sector: "Kacyiru" });
  const { data, loading, error, reload } = useApiResource(
    () => api.get("/dashboards/industry"),
    { dashboard: { stats: [], listings: [] } },
    []
  );
  const dashboard = data.dashboard || { stats: [], listings: [] };
  const action = useAction();

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submitMaterial(event) {
    event.preventDefault();
    const payload = await action.run(() => api.post("/materials", form), "Material submitted for admin approval");
    if (payload) {
      setForm({ category: "Plastic", unit: "kg", district: "Gasabo", sector: "Kacyiru" });
      reload();
    }
  }

  return (
    <DashboardShell title="Waste Producer Dashboard" userRole="industry" active="Dashboard">
      <div className="grid gap-7">
        {loading && <LoadingState />}
        <Alert tone="red">{error || action.error}</Alert>
        <Alert>{action.message}</Alert>
        <StatGrid stats={dashboard.stats} />
        <Panel title="Post a Waste Material">
          <form className="grid items-end gap-5 lg:grid-cols-[1fr_1fr_180px]" onSubmit={submitMaterial}>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
              <label className="grid gap-2">
                <span className="text-xs font-extrabold text-muted">Material type</span>
                <input name="title" value={form.title || ""} onChange={updateField} className="h-11 rounded-lg border border-line bg-slate-50 px-4 text-sm outline-none focus:border-brand-500" placeholder="Plastic scraps / metal offcuts" required />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-extrabold text-muted">Quantity</span>
                <input name="quantity" value={form.quantity || ""} onChange={updateField} className="h-11 rounded-lg border border-line bg-slate-50 px-4 text-sm outline-none focus:border-brand-500" placeholder="e.g. 500" required />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-extrabold text-muted">Condition</span>
                <input name="condition" value={form.condition || ""} onChange={updateField} className="h-11 rounded-lg border border-line bg-slate-50 px-4 text-sm outline-none focus:border-brand-500" placeholder="Clean, mixed, dry" />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-extrabold text-muted">Price / request</span>
                <input name="price" value={form.price || ""} onChange={updateField} className="h-11 rounded-lg border border-line bg-slate-50 px-4 text-sm outline-none focus:border-brand-500" placeholder="Free, negotiable, fixed" />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-extrabold text-muted">Category</span>
                <select name="category" value={form.category} onChange={updateField} className="h-11 rounded-lg border border-line bg-slate-50 px-4 text-sm outline-none focus:border-brand-500">
                  {["Plastic", "Metal", "Wood", "Paper", "Textile", "Organic", "Other"].map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-extrabold text-muted">Unit</span>
                <select name="unit" value={form.unit} onChange={updateField} className="h-11 rounded-lg border border-line bg-slate-50 px-4 text-sm outline-none focus:border-brand-500">
                  {["kg", "tons", "bags", "pieces"].map((unit) => <option key={unit}>{unit}</option>)}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-extrabold text-muted">District</span>
                <input name="district" value={form.district || ""} onChange={updateField} className="h-11 rounded-lg border border-line bg-slate-50 px-4 text-sm outline-none focus:border-brand-500" />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-extrabold text-muted">Sector</span>
                <input name="sector" value={form.sector || ""} onChange={updateField} className="h-11 rounded-lg border border-line bg-slate-50 px-4 text-sm outline-none focus:border-brand-500" />
              </label>
            </div>
            <ActionButton icon={buttonIcons.upload} className="w-full" disabled={action.busy}>{action.busy ? "Publishing..." : "Publish"}</ActionButton>
          </form>
        </Panel>
        <Panel title="My Waste Listings">
          <div className="grid gap-4">
            {dashboard.listings.length === 0 && <p className="text-sm font-semibold text-muted">No materials listed yet.</p>}
            {dashboard.listings.map((listing, index) => (
              <p key={listing} className={`rounded-lg px-5 py-4 text-sm font-bold ${index % 2 === 1 ? "bg-slate-50" : "bg-brand-50"}`}>
                {listing}
              </p>
            ))}
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}
