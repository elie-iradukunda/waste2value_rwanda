import DashboardShell from "../../components/dashboard/DashboardShell";
import { ActionButton, Alert, BarChart, DataTable, LoadingState, Panel, StatGrid, buttonIcons } from "../../components/dashboard/ui";
import { useAction, useApiResource } from "../../hooks/useApi";
import { api } from "../../lib/api";

const columns = [
  { key: "material", label: "Material" },
  { key: "seller", label: "Seller" },
  { key: "buyer", label: "Buyer" },
  { key: "transport", label: "Transport" },
  { key: "status", label: "Status" },
  { key: "certificate", label: "Certificate" }
];

export default function AdminDashboard() {
  const { data, loading, error, reload } = useApiResource(
    () => api.get("/admin/dashboard"),
    { dashboard: { stats: [], activity: [], approvals: [] }, transactions: [] },
    []
  );
  const dashboard = data.dashboard || { stats: [], activity: [], approvals: [] };
  const rows = data.transactions || [];
  const action = useAction();

  async function reviewApproval(approval) {
    if (!approval.id || !approval.type) return;
    if (!window.confirm(`Approve "${approval.title}"? Please confirm.`)) return;
    await action.run(() => api.patch(`/admin/approvals/${approval.type}/${approval.id}`, { status: "approved" }), "Approval updated");
    reload();
  }

  return (
    <DashboardShell title="System Admin Dashboard" userRole="admin" active="Dashboard">
      <div className="grid gap-7">
        {loading && <LoadingState />}
        <Alert tone="red">{error || action.error}</Alert>
        <Alert>{action.message}</Alert>
        <StatGrid stats={dashboard.stats} />
        <div className="grid gap-7 xl:grid-cols-[1.35fr_1fr]">
          <Panel title="Platform Activity">
            <BarChart data={dashboard.activity} />
          </Panel>
          <Panel title="Approval Queue">
            <div className="grid gap-4">
              {dashboard.approvals.length === 0 && <p className="text-sm font-semibold text-muted">Nothing waiting for approval.</p>}
              {dashboard.approvals.map((approval) => (
                <div key={`${approval.type}-${approval.id}`} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-ink">{approval.title}</span>
                  <ActionButton variant="blue" className="h-8 px-5 text-xs" icon={buttonIcons.check} disabled={action.busy} onClick={() => reviewApproval(approval)}>
                    Review
                  </ActionButton>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <Panel title="Recent Transactions">
          <DataTable columns={columns} rows={rows} />
        </Panel>
      </div>
    </DashboardShell>
  );
}
