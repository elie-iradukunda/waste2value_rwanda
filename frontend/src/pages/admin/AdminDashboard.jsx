import DashboardShell from "../../components/dashboard/DashboardShell";
import { ActionButton, Alert, BarChart, DataTable, LoadingState, Panel, StatGrid, buttonIcons } from "../../components/dashboard/ui";
import { useAction, useApiResource } from "../../hooks/useApi";
import { api } from "../../lib/api";
import { dashboards, transactions } from "../../data/platformData";

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
    { dashboard: dashboards.admin, transactions },
    []
  );
  const dashboard = { ...dashboards.admin, ...(data.dashboard || {}) };
  const rows = data.transactions || transactions;
  const action = useAction();

  async function reviewApproval(approval) {
    if (!approval.id) return;
    await action.run(() => api.patch(`/admin/approvals/${approval.id}`, { status: "approved" }), "Approval updated");
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
          <Panel title="Platform Activity">
            <BarChart data={dashboard.activity} />
          </Panel>
          <Panel title="Approval Queue">
            <div className="grid gap-4">
              {dashboard.approvals.map((approval) => (
                <div key={approval.id || approval.title || approval} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-ink">{approval.title || approval}</span>
                  <ActionButton variant="blue" className="h-8 px-5 text-xs" icon={buttonIcons.check} disabled={action.busy} onClick={() => reviewApproval(approval)}>
                    {approval.status === "approved" ? "Approved" : "Review"}
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
