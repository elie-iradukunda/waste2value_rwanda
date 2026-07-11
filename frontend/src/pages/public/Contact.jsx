import { HelpCircle, Mail, MapPin, Phone, Send, ShieldCheck } from "lucide-react";
import PublicLayout from "../../components/PublicLayout";
import { useState } from "react";
import { ActionButton, Alert, Panel, StatusPill } from "../../components/dashboard/ui";

const supportAreas = [
  "Company registration and verification",
  "Material listing and approval support",
  "Buyer request and transport coordination",
  "Certificate verification questions"
];

export default function Contact() {
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("Support request captured for the Waste-to-Value Rwanda team.");
    event.currentTarget.reset();
  }

  return (
    <PublicLayout>
      <section className="mb-8 max-w-3xl">
        <p className="text-xs font-extrabold uppercase text-brand-700">Support center</p>
        <h1 className="mt-3 text-4xl font-extrabold leading-tight text-ink sm:text-5xl">Get help using Waste-to-Value Rwanda.</h1>
        <p className="mt-4 text-base font-semibold leading-7 text-muted">
          Use this form during testing or presentation preparation to show how companies would contact the platform team.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <Panel title="Send a support request">
          <Alert>{message}</Alert>
          <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
            {["Full name", "Email", "Phone", "Company"].map((field) => (
              <label key={field} className="grid gap-2">
                <span className="text-xs font-extrabold text-muted">{field}{field === "Full name" || field === "Email" ? " *" : ""}</span>
                <input
                  required={field === "Full name" || field === "Email"}
                  type={field === "Email" ? "email" : "text"}
                  className="h-12 rounded-lg border border-line bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-brand-500 focus:bg-white"
                  placeholder={field}
                />
              </label>
            ))}
            <label className="grid gap-2">
              <span className="text-xs font-extrabold text-muted">Support request *</span>
              <textarea
                required
                className="min-h-36 rounded-lg border border-line bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-brand-500 focus:bg-white"
                placeholder="Support request"
              />
            </label>
            <ActionButton icon={Send}>Send Message</ActionButton>
          </form>
        </Panel>
        <div className="grid gap-5">
          <Panel title="Direct contacts">
            <div className="grid gap-4 text-sm font-semibold leading-6 text-muted">
              <p className="flex gap-3"><Mail className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />support@wastetovalue.rw</p>
              <p className="flex gap-3"><Phone className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />+250 788 000 000</p>
              <p className="flex gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />Kigali, Rwanda</p>
            </div>
          </Panel>

          <Panel title="Support areas">
            <div className="grid gap-3">
              {supportAreas.map((area) => (
                <div key={area} className="flex items-start gap-3 rounded-lg bg-slate-50 p-4">
                  <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
                  <p className="text-sm font-bold leading-5 text-ink">{area}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <StatusPill tone="blue">Presentation ready</StatusPill>
            <p className="mt-4 flex gap-3 text-sm font-semibold leading-6 text-muted">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-signal-blue" aria-hidden="true" />
              The public contact form gives immediate feedback so you can demonstrate form submission without external email setup.
            </p>
          </Panel>
        </div>
          </div>
    </PublicLayout>
  );
}
