import { ArrowRight, BadgeCheck, MapPin, Search, ShieldCheck, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MaterialImage from "../../components/MaterialImage";
import PublicLayout from "../../components/PublicLayout";
import { ActionButton, Alert, LoadingState, Panel, StatusPill, cx } from "../../components/dashboard/ui";
import { useApiResource } from "../../hooks/useApi";
import { api, normalizeMaterial } from "../../lib/api";
import { materials } from "../../data/platformData";

const qualityOptions = [
  { label: "All quality", value: "all" },
  { label: "Quality verified", value: "verified" },
  { label: "Pending verification", value: "pending" }
];

export default function MarketplacePreview() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [district, setDistrict] = useState("all");
  const [quality, setQuality] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const { data, loading, error } = useApiResource(
    () => api.get("/materials"),
    { materials },
    []
  );
  const rows = (data.materials || materials).map(normalizeMaterial);
  const categories = useMemo(() => ["all", ...new Set(rows.map((row) => row.category).filter(Boolean))], [rows]);
  const districts = useMemo(() => ["all", ...new Set(rows.map((row) => row.location).filter(Boolean))], [rows]);
  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows
      .filter((row) => {
        const text = [row.title, row.category, row.location, row.quantity, row.seller, row.description].filter(Boolean).join(" ").toLowerCase();
        const matchesSearch = !term || text.includes(term);
        const matchesCategory = category === "all" || row.category === category;
        const matchesDistrict = district === "all" || row.location === district;
        const matchesQuality = quality === "all" || (quality === "verified" ? row.qualityVerified : !row.qualityVerified);
        return matchesSearch && matchesCategory && matchesDistrict && matchesQuality;
      })
      .sort((a, b) => {
        if (sortBy === "quantity") return quantityValue(b.quantity) - quantityValue(a.quantity);
        if (sortBy === "title") return String(a.title).localeCompare(String(b.title));
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [category, district, quality, rows, search, sortBy]);

  return (
    <PublicLayout>
      <section className="mb-8 grid items-end gap-6 lg:grid-cols-[1fr_360px]">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase text-brand-700">Public marketplace preview</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight text-ink sm:text-5xl">Find reusable industrial materials before logging in.</h1>
          <p className="mt-4 text-base font-semibold leading-7 text-muted">
            Browse approved listings by category, location and verification status. Buyers can sign in to send a request; producers can list new waste from their dashboard.
          </p>
        </div>
        <div className="rounded-lg border border-brand-900 bg-brand-900 p-6 text-white shadow-subtle">
          <p className="text-sm font-extrabold text-brand-100">Marketplace rules</p>
          <div className="mt-4 grid gap-3 text-sm font-semibold leading-6 text-brand-50">
            <p>Admin approval is required before a listing appears publicly.</p>
            <p>Quality checks and delivery status are visible inside role dashboards.</p>
          </div>
        </div>
      </section>

      <Panel className="mb-6">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_repeat(4,minmax(150px,1fr))]">
          <label className="grid gap-2">
            <span className="text-xs font-extrabold text-muted">Search material, seller or use</span>
            <span className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-12 w-full rounded-lg border border-line bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-brand-500 focus:bg-white"
                placeholder="Search plastic, metal, Kigali..."
              />
            </span>
          </label>
          <FilterSelect label="Category" value={category} onChange={setCategory} options={categories.map((item) => ({ label: item === "all" ? "All categories" : item, value: item }))} />
          <FilterSelect label="Location" value={district} onChange={setDistrict} options={districts.map((item) => ({ label: item === "all" ? "All locations" : item, value: item }))} />
          <FilterSelect label="Quality" value={quality} onChange={setQuality} options={qualityOptions} />
          <FilterSelect label="Sort by" value={sortBy} onChange={setSortBy} options={[
            { label: "Newest first", value: "newest" },
            { label: "Largest quantity", value: "quantity" },
            { label: "Material name", value: "title" }
          ]} />
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Panel title="Buyer guidance">
          <div className="grid gap-4">
            {[
              [BadgeCheck, "Review details", "Compare category, quantity, location and seller before logging in."],
              [ShieldCheck, "Check verification", "Verified materials are marked for easier presentation and buyer confidence."],
              [Truck, "Coordinate delivery", "Transport jobs are created after the producer approves a buyer request."]
            ].map(([Icon, title, text]) => (
              <div key={title} className="flex gap-3 rounded-lg bg-slate-50 p-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
                <div>
                  <h2 className="text-sm font-extrabold text-ink">{title}</h2>
                  <p className="mt-1 text-xs font-semibold leading-5 text-muted">{text}</p>
                </div>
              </div>
            ))}
            <Link to="/login"><ActionButton icon={ArrowRight} className="w-full">Login to Request</ActionButton></Link>
          </div>
        </Panel>

        <Panel
          title="Available Materials"
          action={<span className="rounded-lg bg-brand-50 px-4 py-2 text-xs font-extrabold text-brand-700">{visibleRows.length} shown</span>}
        >
          {loading && <LoadingState label="Loading available materials..." />}
          <Alert tone="red">{error}</Alert>
          <div className="grid gap-4">
            {visibleRows.map((material) => (
              <article key={material.id} className="grid gap-5 rounded-lg border border-line bg-white p-5 shadow-subtle xl:grid-cols-[260px_1fr]">
                <MaterialImage material={material} className="min-h-[220px]" />
                <div>
                  <div className="flex items-start justify-between gap-4 max-sm:flex-col">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone="green">{material.status}</StatusPill>
                        {material.qualityVerified && <StatusPill tone="blue">Quality verified</StatusPill>}
                      </div>
                      <h2 className="mt-4 text-2xl font-extrabold leading-tight text-ink">{material.title}</h2>
                      <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-muted">{material.description || "Reusable industrial material listed by a verified producer."}</p>
                    </div>
                    <Link to="/login"><ActionButton variant="outline" icon={ArrowRight}>Request</ActionButton></Link>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <InfoTile label="Category" value={material.category || "Other"} />
                    <InfoTile label="Quantity" value={material.quantity} />
                    <InfoTile label="Price" value={material.price || "Negotiable"} />
                    <InfoTile label="Seller" value={material.seller || "Verified company"} />
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-bold text-muted">
                    <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-700" aria-hidden="true" />{material.location}</span>
                    <span className={cx("rounded-lg px-3 py-2 text-xs font-extrabold", material.qualityVerified ? "bg-blue-50 text-signal-blue" : "bg-amber-50 text-signal-orange")}>
                      {material.qualityVerified ? "Ready for verified exchange" : "Quality review visible to regulator"}
                    </span>
                  </div>
                </div>
              </article>
            ))}
            {!visibleRows.length && !loading && (
              <div className="rounded-lg border border-dashed border-line bg-slate-50 p-8 text-center">
                <h2 className="text-xl font-extrabold text-ink">No materials match those filters.</h2>
                <p className="mt-3 text-sm font-semibold text-muted">Clear the search or choose all categories and locations.</p>
              </div>
            )}
          </div>
        </Panel>
      </div>

      <section className="mt-8 grid gap-5 sm:grid-cols-3">
        {[
          ["Verified sellers", "Companies are checked before their listings become part of the exchange."],
          ["Transport ready", "Approved requests move into transport jobs with clear delivery status."],
          ["Certificate proof", "Completed deliveries generate a reusable material certificate for reporting."]
        ].map(([label, text]) => (
          <Panel key={label}>
            <StatusPill>{label}</StatusPill>
            <p className="mt-5 text-sm font-semibold leading-6 text-muted">{text}</p>
          </Panel>
        ))}
      </section>
    </PublicLayout>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-extrabold text-muted">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-lg border border-line bg-slate-50 px-3 text-sm font-semibold outline-none transition focus:border-brand-500 focus:bg-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-extrabold uppercase text-muted">{label}</p>
      <p className="mt-2 text-sm font-extrabold text-ink">{value || "-"}</p>
    </div>
  );
}

function quantityValue(value) {
  const number = String(value || "0").replace(/,/g, "").match(/\d+(\.\d+)?/);
  return number ? Number(number[0]) : 0;
}
