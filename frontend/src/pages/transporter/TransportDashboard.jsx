import DashboardShell from "../../components/dashboard/DashboardShell";
import { ActionButton, Alert, LoadingState, Panel, RouteMap, StatGrid } from "../../components/dashboard/ui";
import { useAction, useApiResource } from "../../hooks/useApi";
import { api } from "../../lib/api";
import { dashboards, transportJobs } from "../../data/platformData";

function normalizeJob(job) {
  return {
    id: job.id,
    title: job.title || job.material,
    meta: job.meta || `${job.route} - ${job.quantity}`,
    action: job.action || (job.status === "available" ? "Accept" : "Update"),
    tone: job.tone || (job.status === "available" ? "green" : "blue")
  };
}

export default function TransportDashboard() {
  const { data, loading, error, reload } = useApiResource(
    () => api.get("/transport/dashboard"),
    { dashboard: dashboards.transporter, jobs: transportJobs },
    []
  );
  const dashboard = { ...dashboards.transporter, ...(data.dashboard || {}) };
  const jobs = (data.jobs || transportJobs).map(normalizeJob);
  const action = useAction();

  async function acceptJob(job) {
    await action.run(() => api.patch(`/transport/jobs/${job.id}/status`, { status: "accepted" }), "Transport job accepted");
    reload();
  }

  return (
    <DashboardShell title={dashboard.title} userRole={dashboard.userRole} active={dashboard.active}>
      <div className="grid gap-7">
        {loading && <LoadingState />}
        <Alert tone="red">{error || action.error}</Alert>
        <Alert>{action.message}</Alert>
        <StatGrid stats={dashboard.stats} />
        <div className="grid gap-7 xl:grid-cols-[1.08fr_1fr]">
          <Panel title="Delivery Jobs">
            <div className="grid gap-6">
              {jobs.map((job) => (
                <div key={job.id || job.title} className="flex items-center justify-between gap-4 rounded-lg border border-line bg-slate-50 p-5">
                  <div>
                    <h3 className="text-lg font-extrabold text-ink">{job.title}</h3>
                    <p className="mt-2 text-xs font-bold text-muted">{job.meta}</p>
                  </div>
                  <ActionButton variant={job.tone === "blue" ? "blue" : "primary"} className="h-9 px-6 text-xs" disabled={action.busy} onClick={() => acceptJob(job)}>
                    {job.action}
                  </ActionButton>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Route Optimization">
            <RouteMap />
            <p className="mt-7 text-base font-medium leading-6 text-muted">
              System suggests combining two nearby pickup jobs to reduce fuel cost and delivery time.
            </p>
          </Panel>
        </div>
      </div>
    </DashboardShell>
  );
}
