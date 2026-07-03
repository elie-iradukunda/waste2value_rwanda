import { ArrowRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import PublicLayout from "../../components/PublicLayout";
import { ActionButton, LoadingState, Panel, StatusPill } from "../../components/dashboard/ui";
import { useApiResource } from "../../hooks/useApi";
import { api, normalizeMaterial } from "../../lib/api";
import { materials, publicStats } from "../../data/platformData";

export default function Home() {
  const { data, loading } = useApiResource(
    () => api.get("/public/home"),
    { stats: publicStats, featuredMaterials: materials, roles: [] },
    []
  );
  const featuredMaterials = (data.featuredMaterials || materials).map(normalizeMaterial);

  return (
    <PublicLayout>
      <section className="grid min-h-[560px] items-center gap-12 lg:grid-cols-[1fr_540px]">
        <div className="max-w-[580px]">
          <h1 className="text-4xl font-extrabold leading-[0.95] text-ink sm:text-5xl">
            Industrial Waste Exchange & Circular Economy System
          </h1>
          <p className="mt-8 max-w-[430px] text-base font-medium leading-7 text-muted">
            Connect industries that produce reusable waste with recyclers, SMEs and transport providers. Turn plastic, metal, wood, textile, paper and by-products into valuable raw materials.
          </p>
          <div className="mt-10 flex flex-wrap gap-5">
            <Link to="/marketplace-preview"><ActionButton icon={ArrowRight}>Explore Materials</ActionButton></Link>
            <Link to="/industry/add-material"><ActionButton variant="outline" icon={Plus}>List Waste</ActionButton></Link>
          </div>
        </div>

        <Panel title="Live Waste Marketplace" className="p-10">
          {loading && <LoadingState label="Loading marketplace..." />}
          <div className="grid gap-6">
            {featuredMaterials.slice(0, 3).map((material) => (
              <div key={material.id} className={material.status === "Requested" ? "rounded-lg bg-amber-50 p-6" : "rounded-lg bg-brand-50 p-6"}>
                <div className="flex items-center justify-between gap-5">
                  <div>
                    <h2 className="text-lg font-extrabold text-ink">{material.title}</h2>
                    <p className="mt-2 text-xs font-bold text-muted">{material.location} - {material.quantity}</p>
                  </div>
                  <StatusPill tone={material.status === "Requested" ? "orange" : "green"}>{material.status}</StatusPill>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="mt-8 grid gap-6 rounded-lg border border-line bg-white p-8 sm:grid-cols-2 lg:grid-cols-4">
        {(data.stats || publicStats).map((stat) => (
          <div key={stat.label}>
            <p className="text-3xl font-extrabold text-brand-600">{stat.value}</p>
            <p className="mt-2 text-sm font-semibold text-muted">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 py-2 lg:grid-cols-5">
        {(data.roles || []).map((role) => (
          <Panel key={role.role}>
            <h2 className="text-lg font-extrabold text-ink">{role.title}</h2>
            <div className="mt-4 grid gap-2">
              {role.duties.map((duty) => (
                <p key={duty} className="text-xs font-bold text-muted">{duty}</p>
              ))}
            </div>
          </Panel>
        ))}
      </section>

      <section className="grid gap-6 py-14 lg:grid-cols-3">
        {["Industry lists waste", "Buyer requests material", "Certificate is generated"].map((title, index) => (
          <Panel key={title}>
            <p className="text-sm font-extrabold text-brand-600">0{index + 1}</p>
            <h2 className="mt-4 text-2xl font-extrabold text-ink">{title}</h2>
            <p className="mt-4 text-sm font-medium leading-6 text-muted">
              Verified companies exchange reusable materials, coordinate transport and build circular economy proof.
            </p>
          </Panel>
        ))}
      </section>
    </PublicLayout>
  );
}
