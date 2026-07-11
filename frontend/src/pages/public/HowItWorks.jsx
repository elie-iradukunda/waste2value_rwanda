import { Award, ClipboardCheck, Factory, FileCheck2, PackageSearch, Send, Truck } from "lucide-react";
import PublicLayout from "../../components/PublicLayout";
import { Panel } from "../../components/dashboard/ui";

const steps = [
  { icon: Factory, title: "Industry lists waste", text: "A producer submits material type, quantity, location, price and pickup details." },
  { icon: ClipboardCheck, title: "Admin reviews listing", text: "The platform team checks the listing before it becomes visible to buyers." },
  { icon: PackageSearch, title: "Buyer searches material", text: "Recyclers and SMEs compare approved materials in the marketplace." },
  { icon: Send, title: "Buyer sends request", text: "The buyer requests quantity, intended use and any negotiation notes." },
  { icon: Award, title: "Producer approves", text: "The waste producer accepts the request and a transaction is created." },
  { icon: Truck, title: "Transport completes delivery", text: "A transporter accepts the job and updates pickup, transit and delivered status." },
  { icon: FileCheck2, title: "Certificate is generated", text: "After buyer confirmation, a public verification certificate proves reuse activity." }
];

export default function HowItWorks() {
  return (
    <PublicLayout>
      <section className="mb-8 max-w-3xl">
        <p className="text-xs font-extrabold uppercase text-brand-700">Exchange workflow</p>
        <h1 className="mt-3 text-4xl font-extrabold leading-tight text-ink sm:text-5xl">A complete material reuse journey from listing to certificate.</h1>
        <p className="mt-4 text-base font-semibold leading-7 text-muted">
          Each role has a clear responsibility, so the presentation can move from public browsing to real dashboard actions without confusion.
        </p>
      </section>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Panel key={step.title} className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-brand-600">{String(index + 1).padStart(2, "0")}</p>
                  <h2 className="mt-2 text-lg font-extrabold leading-tight text-ink">{step.title}</h2>
                  <p className="mt-3 text-sm font-semibold leading-6 text-muted">{step.text}</p>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      <Panel title="What the audience should see live" className="mt-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            "Reusable waste becomes a public marketplace listing.",
            "Buyer, producer and transporter actions update the same transaction.",
            "Certificate verification gives proof after delivery is confirmed."
          ].map((text) => (
            <p key={text} className="rounded-lg bg-brand-50 p-5 text-sm font-bold leading-6 text-brand-900">{text}</p>
          ))}
        </div>
      </Panel>
    </PublicLayout>
  );
}
