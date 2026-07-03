import DashboardShell from "../components/dashboard/DashboardShell";
import { Link } from "react-router-dom";
import { ActionButton, Alert, LoadingState, MaterialRow, Panel, StatGrid, buttonIcons } from "../components/dashboard/ui";
import { useApiResource } from "../hooks/useApi";
import { api, normalizeMaterial } from "../lib/api";
import { dashboards, materials } from "../data/platformData";

export default function MaterialsIndex() {
  const { data, loading, error } = useApiResource(
    () => api.get("/materials"),
    { materials },
    []
  );
  const rows = (data.materials || materials).map(normalizeMaterial);

  return (
    <DashboardShell title="Materials" userRole="industry" active="Materials">
      <div className="grid gap-7">
        {loading && <LoadingState />}
        <Alert tone="red">{error}</Alert>
        <StatGrid stats={dashboards.industry.stats} />
        <Panel title="Waste Material Catalog" action={<Link to="/industry/add-material"><ActionButton icon={buttonIcons.upload}>Add Material</ActionButton></Link>}>
          <div className="grid gap-2">
            {rows.map((material) => <MaterialRow key={material.id} material={material} showMatch={false} />)}
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}
