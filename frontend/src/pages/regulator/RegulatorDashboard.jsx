import DashboardShell from "../../components/dashboard/DashboardShell";
import { Alert, LoadingState, Panel, ProgressBar, StatGrid, StatusPill } from "../../components/dashboard/ui";
import { useApiResource } from "../../hooks/useApi";
import { api } from "../../lib/api";
import { dashboards } from "../../data/platformData";

function alertTone(level) {
  if (level === "High") return "red";
  if (level === "Medium") return "orange";
  return "green";
}

export default function RegulatorDashboard() {
  const { data, loading, error } = useApiResource(
    () => api.get("/analytics/regulator"),
    { dashboard: dashboards.regulator },
    []
  );
  const dashboard = { ...dashboards.regulator, ...(data.dashboard || {}) };

  return (
    <DashboardShell title={dashboard.title} userRole={dashboard.userRole} active={dashboard.active}>
      <div className="grid gap-7">
        {loading && <LoadingState />}
        <Alert tone="red">{error}</Alert>
        <StatGrid stats={dashboard.stats} />
        <div className="grid gap-7 xl:grid-cols-[1.35fr_1fr]">
          <Panel title="Circular Economy Impact">
            <div className="grid gap-7">
              {dashboard.impact.map((item) => <ProgressBar key={item.label} label={item.label} value={item.value} max={45} />)}
            </div>
          </Panel>
          <Panel title="Compliance Alerts">
            <div className="grid gap-5">
              {dashboard.alerts.map((alert) => (
                <div key={alert.title} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white p-4">
                  <span className="text-sm font-semibold text-ink">{alert.title}</span>
                  <StatusPill tone={alertTone(alert.level)}>{alert.level}</StatusPill>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </DashboardShell>
  );
}
