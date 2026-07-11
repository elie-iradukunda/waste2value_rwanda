import { useParams, Link } from "react-router-dom";
import DashboardShell from "../components/dashboard/DashboardShell";
import { ActionButton, Alert, LoadingState, Panel, StatusPill, buttonIcons } from "../components/dashboard/ui";
import { useAction, useApiResource } from "../hooks/useApi";
import { api, normalizeMaterial } from "../lib/api";

export default function MaterialDetail() {
  const { id } = useParams();
  const { data, loading, error } = useApiResource(() => api.get(`/materials/${id}`), { material: null }, [id]);
  const action = useAction();

  if (loading) {
    return (
      <DashboardShell title="Material Details" userRole="buyer" active="Marketplace">
        <LoadingState />
      </DashboardShell>
    );
  }

  if (!data.material) {
    return (
      <DashboardShell title="Material Details" userRole="buyer" active="Marketplace">
        <Alert tone="red">{error || "Material not found"}</Alert>
      </DashboardShell>
    );
  }

  const material = normalizeMaterial(data.material);

  async function requestMaterial() {
    await action.run(() => api.post("/requests", { materialId: material.id, requestedQuantity: data.material.quantity }), "Material request sent");
  }

  return (
    <DashboardShell title={material.title} userRole="buyer" active="Marketplace">
      <div className="grid gap-7 xl:grid-cols-[1.3fr_1fr]">
        <Panel title={material.title}>
          <Alert>{action.message}</Alert>
          <Alert tone="red">{action.error}</Alert>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-xs font-bold text-muted">Category</p><p className="text-sm font-extrabold text-ink">{material.category}</p></div>
            <div><p className="text-xs font-bold text-muted">Quantity</p><p className="text-sm font-extrabold text-ink">{material.quantity}</p></div>
            <div><p className="text-xs font-bold text-muted">Condition</p><p className="text-sm font-extrabold text-ink">{material.condition || "Not specified"}</p></div>
            <div><p className="text-xs font-bold text-muted">Price</p><p className="text-sm font-extrabold text-ink">{material.price}</p></div>
            <div><p className="text-xs font-bold text-muted">Location</p><p className="text-sm font-extrabold text-ink">{material.location}</p></div>
            <div><p className="text-xs font-bold text-muted">Status</p><StatusPill tone={material.status === "Available" ? "green" : "orange"}>{material.status}</StatusPill></div>
          </div>
          <p className="mt-6 text-sm font-semibold leading-6 text-muted">{material.description || "No further description was provided by the waste producer."}</p>
          {material.safetyNotes && <p className="mt-4 rounded-lg bg-amber-50 p-4 text-xs font-bold text-amber-700">Safety notes: {material.safetyNotes}</p>}
          <ActionButton icon={buttonIcons.send} className="mt-8" disabled={action.busy} onClick={requestMaterial}>
            {action.busy ? "Sending request..." : "Request This Material"}
          </ActionButton>
        </Panel>
        <Panel title="Waste Producer">
          <p className="text-lg font-extrabold text-ink">{material.seller}</p>
          <p className="mt-2 text-sm font-semibold text-muted">{material.pickupAddress}</p>
          <Link to="/buyer/marketplace" className="mt-8 inline-block text-sm font-bold text-brand-700">Back to marketplace</Link>
        </Panel>
      </div>
    </DashboardShell>
  );
}
