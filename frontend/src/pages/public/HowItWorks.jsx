import PublicLayout from "../../components/PublicLayout";
import { Panel } from "../../components/dashboard/ui";

const steps = [
  "Industry lists waste",
  "Buyer searches material",
  "Buyer sends request",
  "Industry approves request",
  "Transport is arranged",
  "Delivery is completed",
  "Certificate is generated"
];

export default function HowItWorks() {
  return (
    <PublicLayout>
      <h1 className="text-4xl font-extrabold text-ink">How It Works</h1>
      <div className="mt-8 grid gap-5 lg:grid-cols-7">
        {steps.map((step, index) => (
          <Panel key={step} className="p-5">
            <p className="text-sm font-extrabold text-brand-600">{String(index + 1).padStart(2, "0")}</p>
            <h2 className="mt-5 text-lg font-extrabold leading-tight text-ink">{step}</h2>
          </Panel>
        ))}
      </div>
      <Panel title="Circular exchange flow" className="mt-8">
        <div className="grid gap-5 md:grid-cols-3">
          {["Reusable waste becomes raw material", "Transport jobs connect nearby companies", "Digital proof supports environmental reporting"].map((text) => (
            <p key={text} className="rounded-lg bg-brand-50 p-5 text-sm font-bold leading-6 text-brand-900">{text}</p>
          ))}
        </div>
      </Panel>
    </PublicLayout>
  );
}
