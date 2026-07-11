import DashboardShell from "../../components/dashboard/DashboardShell";
import { Alert, LoadingState, Panel, StatGrid, ActionButton } from "../../components/dashboard/ui";
import { useAction, useApiResource } from "../../hooks/useApi";
import { api } from "../../lib/api";

export default function TransportDashboard() {
  const { data, loading, error, reload } = useApiResource(
    () => api.get("/transport/dashboard"),
    { dashboard: { stats: [] }, jobs: [] },
    []
  );
  const dashboard = data.dashboard || { stats: [] };
  const jobs = (data.jobs || []).filter((job) => job.status === "pending");
  const action = useAction();

  async function acceptJob(job) {
    if (!window.confirm(`Accept the pickup job for "${job.title}"? Please confirm.`)) return;
    await action.run(() => api.patch(`/transport/jobs/${job.id}/status`, { status: "accepted" }), "Pickup job accepted");
    reload();
  }

  return (
    <DashboardShell title="Transport Provider Dashboard" userRole="transporter" active="Dashboard">
      <div className="grid gap-7">
        {loading && <LoadingState />}
        <Alert tone="red">{error || action.error}</Alert>
        <Alert>{action.message}</Alert>
        <StatGrid stats={dashboard.stats} />
        <Panel title="Delivery Requests Available">
          <div className="grid gap-6">
            {jobs.length === 0 && <p className="text-sm font-semibold text-muted">No delivery requests waiting right now.</p>}
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between gap-4 rounded-lg border border-line bg-slate-50 p-5">
                <div>
                  <h3 className="text-lg font-extrabold text-ink">{job.title}</h3>
                  <p className="mt-2 text-xs font-bold text-muted">{job.route} - {job.quantity}</p>
                </div>
                <ActionButton disabled={action.busy} onClick={() => acceptJob(job)}>Accept</ActionButton>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}
