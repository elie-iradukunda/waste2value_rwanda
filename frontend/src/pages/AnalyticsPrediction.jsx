import DashboardShell from "../components/dashboard/DashboardShell";
import { Alert, LineChart, LoadingState, Panel, StatGrid } from "../components/dashboard/ui";
import { useApiResource } from "../hooks/useApi";
import { api } from "../lib/api";
import { dashboards } from "../data/platformData";

export default function AnalyticsPrediction() {
  const { data, loading, error } = useApiResource(
    () => api.get("/analytics/prediction"),
    { dashboard: dashboards.analytics },
    []
  );
  const dashboard = { ...dashboards.analytics, ...(data.dashboard || {}) };

  return (
    <DashboardShell title={dashboard.title} userRole={dashboard.userRole} active={dashboard.active}>
      <div className="grid gap-7">
        {loading && <LoadingState />}
        <Alert tone="red">{error}</Alert>
        <StatGrid stats={dashboard.stats} />
        <div className="grid gap-7 xl:grid-cols-[1.45fr_1fr]">
          <Panel title="Waste Supply Forecast">
            <LineChart data={dashboard.forecast} />
          </Panel>
          <Panel title="AI Recommendations">
            <div className="grid gap-5">
              {dashboard.recommendations.map((recommendation) => (
                <p key={recommendation} className="rounded-lg bg-brand-50 p-5 text-sm font-bold leading-6 text-ink">
                  {recommendation}
                </p>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </DashboardShell>
  );
}
