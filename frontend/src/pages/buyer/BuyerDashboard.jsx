import DashboardShell from "../../components/dashboard/DashboardShell";
import { ActionButton, Alert, LoadingState, MaterialRow, Panel, StatGrid, StatusPill, buttonIcons } from "../../components/dashboard/ui";
import { useAction, useApiResource } from "../../hooks/useApi";
import { api, normalizeMaterial } from "../../lib/api";
import { dashboards, materials } from "../../data/platformData";

export default function BuyerDashboard() {
  const { data, loading, error, reload } = useApiResource(
    () => api.get("/dashboards/buyer"),
    { dashboard: dashboards.buyer, materials },
    []
  );
  const dashboard = { ...dashboards.buyer, ...(data.dashboard || {}) };
  const marketplace = (data.materials || materials).map(normalizeMaterial);
  const action = useAction();

  async function requestMaterial(material = marketplace[0]) {
    if (!material) return;
    await action.run(
      () => api.post("/requests", {
        materialId: material.id,
        material: material.title,
        seller: material.seller,
        quantity: material.quantity,
        buyer: "Eco Recycle Rwanda",
        offeredPrice: material.price || "Negotiable"
      }),
      "Material request sent"
    );
    reload();
  }

  return (
    <DashboardShell title={dashboard.title} userRole={dashboard.userRole} active={dashboard.active}>
      <div className="grid gap-7">
        {loading && <LoadingState />}
        <Alert tone="red">{error || action.error}</Alert>
        <Alert>{action.message}</Alert>
        <StatGrid stats={dashboard.stats} />
        <div className="grid gap-7 xl:grid-cols-[1.35fr_1fr]">
          <Panel title="Available Materials">
            <div className="grid gap-1">
              {marketplace.map((material) => (
                <button key={material.id} type="button" className="text-left" onClick={() => requestMaterial(material)}>
                  <MaterialRow material={material} />
                </button>
              ))}
            </div>
          </Panel>
          <Panel title="Smart Matching Preferences">
            <div className="grid grid-cols-2 gap-4">
              {dashboard.preferences.map((preference, index) => (
                <StatusPill key={preference} tone={index % 2 === 0 ? "green" : "gray"}>{preference}</StatusPill>
              ))}
            </div>
            <h3 className="mt-10 text-xl font-extrabold text-ink">Recommended request</h3>
            <p className="mt-4 text-base font-medium leading-6 text-muted">
              Based on previous purchases, the system recommends 1.5-2 tons of clean plastic scrap from Kigali SEZ this week.
            </p>
            <ActionButton icon={buttonIcons.send} className="mt-10" disabled={action.busy} onClick={() => requestMaterial()}>
              {action.busy ? "Requesting..." : "Request Material"}
            </ActionButton>
          </Panel>
        </div>
      </div>
    </DashboardShell>
  );
}
