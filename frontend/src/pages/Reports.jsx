import DashboardShell from "../components/dashboard/DashboardShell";
import { ActionButton, Alert, LoadingState, Panel, ProgressBar, StatGrid, buttonIcons } from "../components/dashboard/ui";
import { useApiResource } from "../hooks/useApi";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";

export default function Reports({ role }) {
  const { role: currentRole } = useAuth();
  const effectiveRole = role || currentRole || "admin";
  const endpoint = effectiveRole === "regulator" ? "/analytics/regulator" : "/admin/reports";
  const { data, loading, error } = useApiResource(() => api.get(endpoint), { dashboard: { stats: [], impact: [] } }, [endpoint]);
  const dashboard = data.dashboard || { stats: [], impact: [] };

  return (
    <DashboardShell title="Reports" userRole={effectiveRole} active="Reports">
      <div className="grid gap-7">
        {loading && <LoadingState />}
        <Alert tone="red">{error}</Alert>
        <StatGrid stats={dashboard.stats} />
        <Panel
          title="Waste Category Report"
          action={<ActionButton variant="outline" icon={buttonIcons.download} onClick={() => window.print()}>Print Report</ActionButton>}
        >
          <div className="grid gap-7">
            {(dashboard.impact || []).length === 0 && <p className="text-sm font-semibold text-muted">No material data recorded yet.</p>}
            {(dashboard.impact || []).map((item) => <ProgressBar key={item.label} label={item.label} value={item.value} max={100} />)}
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}
