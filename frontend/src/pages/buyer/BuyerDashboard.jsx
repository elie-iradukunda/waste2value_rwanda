import DashboardShell from "../../components/dashboard/DashboardShell";
import { Alert, LoadingState, MaterialRow, Panel, StatGrid } from "../../components/dashboard/ui";
import { useAction, useApiResource } from "../../hooks/useApi";
import { api, normalizeMaterial } from "../../lib/api";

export default function BuyerDashboard() {
  const { data, loading, error, reload } = useApiResource(
    () => api.get("/dashboards/buyer"),
    { dashboard: { stats: [] }, materials: [] },
    []
  );
  const dashboard = data.dashboard || { stats: [] };
  const marketplace = (data.materials || []).map(normalizeMaterial);
  const action = useAction();

  async function requestMaterial(material) {
    if (!window.confirm(`Request "${material.title}"? Please confirm.`)) return;
    await action.run(
      () => api.post("/requests", { materialId: material.id }),
      "Material request sent"
    );
    reload();
  }

  return (
    <DashboardShell title="Recycler / SME Dashboard" userRole="buyer" active="Dashboard">
      <div className="grid gap-7">
        {loading && <LoadingState />}
        <Alert tone="red">{error || action.error}</Alert>
        <Alert>{action.message}</Alert>
        <StatGrid stats={dashboard.stats} />
        <Panel title="Available Materials">
          <div className="grid gap-1">
            {marketplace.length === 0 && <p className="text-sm font-semibold text-muted">No materials available right now.</p>}
            {marketplace.map((material) => (
              <button key={material.id} type="button" className="text-left" disabled={action.busy} onClick={() => requestMaterial(material)}>
                <MaterialRow material={material} showMatch={false} />
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}
