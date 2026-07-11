import { ArrowRight, BadgeCheck, BarChart3, Factory, Leaf, PackageCheck, Plus, ShieldCheck, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import MaterialImage from "../../components/MaterialImage";
import PublicLayout from "../../components/PublicLayout";
import { ActionButton, LoadingState, Panel, StatusPill } from "../../components/dashboard/ui";
import { useApiResource } from "../../hooks/useApi";
import { api, normalizeMaterial } from "../../lib/api";
import { materials, publicStats } from "../../data/platformData";

const roleCards = [
  { icon: Factory, title: "Waste producers", text: "Publish reusable industrial by-products with quantity, location, condition and pickup details." },
  { icon: PackageCheck, title: "Recyclers and SMEs", text: "Find affordable inputs, send requests, track approvals and confirm received materials." },
  { icon: Truck, title: "Transport providers", text: "Accept pickup jobs and update delivery status from accepted to delivered." },
  { icon: ShieldCheck, title: "Regulators", text: "Verify material quality, monitor recovery activity and review impact reports." }
];

const trustItems = [
  "Verified companies before exchange",
  "Admin approval before public listing",
  "Quality verification and digital certificates"
];

export default function Home() {
  const { data, loading } = useApiResource(
    () => api.get("/public/home"),
    { stats: publicStats, featuredMaterials: materials, roles: [] },
    []
  );
  const featuredMaterials = (data.featuredMaterials || materials).map(normalizeMaterial);
  const stats = data.stats || publicStats;

  return (
    <PublicLayout>
      <section className="grid items-center gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_520px] lg:py-12">
        <div className="max-w-[680px]">
          <div className="inline-flex items-center gap-2 rounded-lg border border-brand-100 bg-white px-4 py-2 text-xs font-extrabold uppercase text-brand-700 shadow-subtle">
            <Leaf className="h-4 w-4" aria-hidden="true" />
            Circular economy marketplace
          </div>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight text-ink sm:text-5xl lg:text-6xl">
            Turn industrial waste into verified reusable value.
          </h1>
          <p className="mt-6 max-w-[600px] text-base font-semibold leading-8 text-muted sm:text-lg">
            Waste-to-Value Rwanda helps producers list reusable materials, buyers request them, transporters move them, and regulators verify the circular impact.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/marketplace-preview"><ActionButton icon={ArrowRight}>Explore Materials</ActionButton></Link>
            <Link to="/industry"><ActionButton variant="outline" icon={Plus}>List Waste</ActionButton></Link>
            <Link to="/how-it-works"><ActionButton variant="ghost" icon={BarChart3}>View Process</ActionButton></Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {trustItems.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg border border-brand-100 bg-white p-4 shadow-subtle">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                <p className="text-sm font-bold leading-5 text-ink">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <Panel title="Live Waste Marketplace" className="overflow-hidden p-0">
          <div className="border-b border-line bg-brand-900 px-6 py-5 text-white">
            <p className="text-xs font-extrabold uppercase text-brand-100">Latest approved listings</p>
            <p className="mt-2 text-sm font-semibold text-brand-50">Ready for buyers to review and request.</p>
          </div>
          {loading && <LoadingState label="Loading marketplace..." />}
          <div className="grid gap-4 p-5">
            {featuredMaterials.slice(0, 3).map((material) => (
              <article key={material.id} className="grid gap-4 rounded-lg border border-line bg-white p-4 shadow-subtle sm:grid-cols-[142px_1fr]">
                <MaterialImage material={material} compact className="min-h-[120px]" />
                <div className="flex items-start justify-between gap-5">
                  <div className="min-w-0 pt-1">
                    <h2 className="truncate text-lg font-extrabold text-ink">{material.title}</h2>
                    <p className="mt-2 text-sm font-bold text-muted">{material.location} - {material.quantity}</p>
                    <p className="mt-3 text-xs font-extrabold uppercase text-brand-700">{material.category || "Reusable material"}</p>
                  </div>
                  <StatusPill tone={material.status === "Requested" ? "orange" : "green"}>{material.status}</StatusPill>
                </div>
              </article>
            ))}
            {!featuredMaterials.length && (
              <p className="rounded-lg bg-brand-50 p-5 text-sm font-bold text-muted">No approved materials are visible yet.</p>
            )}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 rounded-lg border border-line bg-white p-5 shadow-subtle sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg bg-slate-50 p-5">
            <p className="text-3xl font-extrabold text-brand-700">{stat.value}</p>
            <p className="mt-2 text-sm font-semibold text-muted">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="py-12">
        <div className="mb-6 flex items-end justify-between gap-5 max-md:flex-col max-md:items-start">
          <div>
            <p className="text-xs font-extrabold uppercase text-brand-700">Role-based platform</p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink">Every user sees the tools they need.</h2>
          </div>
          <Link to="/login" className="text-sm font-extrabold text-brand-700 hover:text-brand-900">Open demo login</Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {roleCards.map((card) => {
            const Icon = card.icon;
            return (
              <Panel key={card.title} className="h-full">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-xl font-extrabold text-ink">{card.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-muted">{card.text}</p>
              </Panel>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 pb-12 lg:grid-cols-3">
        {[
          ["01", "Publish reusable waste", "A producer submits material details and the admin reviews it before it becomes public."],
          ["02", "Request and approve", "A buyer requests an available listing and the producer approves the exchange."],
          ["03", "Deliver and certify", "Transport status is tracked until buyer confirmation generates a reusable material certificate."]
        ].map(([number, title, text]) => (
          <Panel key={title}>
            <p className="text-sm font-extrabold text-brand-600">{number}</p>
            <h2 className="mt-4 text-2xl font-extrabold text-ink">{title}</h2>
            <p className="mt-4 text-sm font-semibold leading-6 text-muted">{text}</p>
          </Panel>
        ))}
      </section>
    </PublicLayout>
  );
}
