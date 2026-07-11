import DashboardShell from "../../components/dashboard/DashboardShell";
import { Alert, LoadingState, Panel, ProgressBar, StatGrid } from "../../components/dashboard/ui";
import { useApiResource } from "../../hooks/useApi";
import { api } from "../../lib/api";

export default function RegulatorDashboard() {
  const { data, loading, error } = useApiResource(
    () => api.get("/dashboards/regulator"),
    { dashboard: { stats: [], impact: [] } },
    []
  );
  const dashboard = data.dashboard || { stats: [], impact: [] };

  return (
    <DashboardShell title="COPED / Waste Operator Dashboard" userRole="regulator" active="Dashboard">
      <div className="grid gap-7">
        {loading && <LoadingState />}
        <Alert tone="red">{error}</Alert>
        <StatGrid stats={dashboard.stats} />
        <Panel title="Circular Economy Impact (Sorting and Recovery by Category)">
          <div className="grid gap-7">
            {dashboard.impact.length === 0 && <p className="text-sm font-semibold text-muted">No material data recorded yet.</p>}
            {dashboard.impact.map((item) => <ProgressBar key={item.label} label={item.label} value={item.value} max={100} />)}
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}
