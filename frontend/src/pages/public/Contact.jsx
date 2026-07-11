import PublicLayout from "../../components/PublicLayout";
import { useState } from "react";
import { ActionButton, Alert, Panel, buttonIcons } from "../../components/dashboard/ui";

export default function Contact() {
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("Support request captured for the Waste-to-Value Rwanda team.");
    event.currentTarget.reset();
  }

  return (
    <PublicLayout>
      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <Panel title="Contact Waste-to-Value Rwanda">
          <Alert>{message}</Alert>
          <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
            {["Full name", "Email", "Phone", "Company"].map((field) => (
              <input key={field} required={field === "Full name" || field === "Email"} type={field === "Email" ? "email" : "text"} className="h-12 rounded-lg border border-line bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-brand-500" placeholder={field} />
            ))}
            <textarea required className="min-h-32 rounded-lg border border-line bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-brand-500" placeholder="Support request" />
            <ActionButton icon={buttonIcons.send}>Send Message</ActionButton>
          </form>
        </Panel>
        <Panel title="Support">
          <div className="grid gap-6 text-sm font-semibold leading-6 text-muted">
            <p>Email: support@wastetovalue.rw</p>
            <p>Phone: +250 788 000 000</p>
            <p>Location: Kigali, Rwanda</p>
            <p>Companies can request help with registration, listing approval, transport coordination and certificate verification.</p>
          </div>
        </Panel>
      </div>
    </PublicLayout>
  );
}
