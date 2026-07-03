import PublicLayout from "../../components/PublicLayout";
import { ActionButton, Alert, LoadingState, MaterialRow, Panel, StatusPill, buttonIcons } from "../../components/dashboard/ui";
import { useApiResource } from "../../hooks/useApi";
import { api, normalizeMaterial } from "../../lib/api";
import { materials } from "../../data/platformData";

export default function MarketplacePreview() {
  const { data, loading, error } = useApiResource(
    () => api.get("/materials"),
    { materials },
    []
  );
  const rows = (data.materials || materials).map(normalizeMaterial);

  return (
    <PublicLayout>
      <section className="mb-8 flex items-end justify-between gap-6 max-md:flex-col max-md:items-stretch">
        <div>
          <h1 className="text-4xl font-extrabold text-ink">Waste Marketplace</h1>
          <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-muted">
            Browse reusable industrial materials by category, district, price, quantity and seller verification.
          </p>
        </div>
        <ActionButton variant="outline" icon={buttonIcons.filter}>Filter</ActionButton>
      </section>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Panel title="Filters">
          <div className="grid gap-4">
            {["Category", "District", "Price range", "Availability", "Seller rating"].map((field) => (
              <label key={field} className="grid gap-2">
                <span className="text-xs font-extrabold text-muted">{field}</span>
                <select className="h-11 rounded-lg border border-line bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-brand-500">
                  <option>All {field.toLowerCase()}</option>
                </select>
              </label>
            ))}
          </div>
        </Panel>

        <Panel title="Available Materials">
          {loading && <LoadingState label="Loading available materials..." />}
          <Alert tone="red">{error}</Alert>
          <div className="grid gap-2">
            {rows.map((material) => (
              <div key={material.id} className="rounded-lg border border-line bg-white px-5">
                <MaterialRow material={material} showMatch={false} />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <section className="mt-8 grid gap-5 sm:grid-cols-3">
        {["Verified sellers", "Transport distance", "Free pickup"].map((label) => (
          <Panel key={label}>
            <StatusPill>{label}</StatusPill>
            <p className="mt-5 text-sm font-medium leading-6 text-muted">Materials include location, status, quantity and request readiness.</p>
          </Panel>
        ))}
      </section>
    </PublicLayout>
  );
}
