import ManagementPage from "../components/dashboard/ManagementPage";
import { useAction, useApiResource } from "../hooks/useApi";
import { api } from "../lib/api";
import { managementRows } from "../data/platformData";

const columns = [
  { key: "title", label: "Title" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "date", label: "Date" }
];

export default function Messages() {
  const { data, error, reload } = useApiResource(
    () => api.get("/notifications"),
    { notifications: managementRows.notifications },
    []
  );
  const action = useAction();
  const rows = (data.notifications || managementRows.notifications).map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type,
    status: item.isRead === false ? "Unread" : item.status || "Read",
    date: item.date || "Today"
  }));

  async function handleAction() {
    const id = rows[0]?.id || 1;
    await action.run(() => api.patch(`/notifications/${id}/read`, {}), "Notification marked as read");
    reload();
  }

  return (
    <ManagementPage
      title="Messages & Notifications"
      role="admin"
      active="Messages"
      columns={columns}
      rows={rows}
      actions={["Mark selected as read", "Send platform notice", "Export notification log"]}
      onAction={handleAction}
      message={action.message}
      error={error || action.error}
      busy={action.busy}
    />
  );
}
