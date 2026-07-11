import { BarChart3, Building2, Factory, Recycle, ShieldCheck, Truck } from "lucide-react";
import PublicLayout from "../../components/PublicLayout";
import { Panel, ProgressBar, StatusPill } from "../../components/dashboard/ui";

const capabilities = [
  { icon: Factory, title: "Waste visibility", text: "Industrial waste is organized by type, quantity, location, price and condition instead of staying hidden in offline records." },
  { icon: Building2, title: "Buyer access", text: "Recyclers and SMEs can discover reusable inputs and request the amount they need." },
  { icon: Truck, title: "Transport coordination", text: "Pickup and delivery progress is tracked through the same transaction record." },
  { icon: ShieldCheck, title: "Regulatory proof", text: "Quality verification and certificates support credible environmental reporting." }
];

export default function About() {
  return (
    <PublicLayout>
      <section className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="text-xs font-extrabold uppercase text-brand-700">Impact and value</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight text-ink sm:text-5xl">A practical platform for Rwanda’s circular economy.</h1>
          <p className="mt-6 max-w-3xl text-base font-semibold leading-8 text-muted">
            Waste-to-Value Rwanda helps companies reduce disposal costs, gives SMEs access to affordable raw materials, and creates trusted digital proof for reuse activity from listing to certificate.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <Panel key={item.title}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h2 className="mt-5 text-xl font-extrabold text-ink">{item.title}</h2>
                  <p className="mt-4 text-sm font-semibold leading-6 text-muted">{item.text}</p>
                </Panel>
              );
            })}
          </div>
        </div>
        <Panel title="Impact mix" className="h-fit">
          <div className="grid gap-5">
            <ProgressBar label="Plastic" value={82} />
            <ProgressBar label="Metal" value={66} />
            <ProgressBar label="Wood" value={48} />
            <ProgressBar label="Paper" value={34} />
          </div>
          <div className="mt-8 rounded-lg bg-brand-50 p-5">
            <StatusPill>Presentation focus</StatusPill>
            <p className="mt-4 text-sm font-semibold leading-6 text-brand-900">
              Show a complete live exchange: industry posts material, admin approves, buyer requests, transporter delivers, buyer confirms, and the certificate verifies publicly.
            </p>
          </div>
        </Panel>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-3">
        {[
          [Recycle, "Reduce disposal pressure", "Reusable materials can return to production instead of becoming unmanaged waste."],
          [BarChart3, "Measure impact", "Reports summarize quantities, completed exchanges and reuse activity."],
          [ShieldCheck, "Build trust", "Role-based approvals and certificates make the workflow easier to present and verify."]
        ].map(([Icon, title, text]) => (
          <Panel key={title}>
            <Icon className="h-7 w-7 text-brand-700" aria-hidden="true" />
            <h2 className="mt-5 text-xl font-extrabold text-ink">{title}</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-muted">{text}</p>
          </Panel>
        ))}
      </section>
    </PublicLayout>
  );
}
