import { useEffect, useMemo } from "react";
import DashboardShell from "../components/dashboard/DashboardShell";
import { ActionButton, Alert, LoadingState, Panel, QrPattern, buttonIcons } from "../components/dashboard/ui";
import { useAction, useApiResource } from "../hooks/useApi";
import { api } from "../lib/api";
import { certificates } from "../data/platformData";

export default function DigitalCertificate() {
  const verificationNumber = useMemo(() => new URLSearchParams(window.location.search).get("verify"), []);
  const { data, loading, error, reload } = useApiResource(
    () => api.get("/certificates"),
    { certificates },
    []
  );
  const action = useAction();
  const certificate = (data.certificates || certificates)[0] || certificates[0];
  const rows = [
    ["Waste Material", certificate.materialType],
    ["Quantity Reused", certificate.quantityReused],
    ["Waste Producer", certificate.sellerCompanyName],
    ["Buyer / Recycler", certificate.buyerCompanyName],
    ["Transport Provider", certificate.transporterName],
    ["Delivery Status", certificate.deliveryStatus],
    ["Issue Date", certificate.issueDate]
  ];

  useEffect(() => {
    if (!verificationNumber) return;
    action.run(() => api.get(`/certificates/verify/${verificationNumber}`), "Certificate verified from QR link");
  }, [verificationNumber]);

  async function generateCertificate() {
    await action.run(() => api.post("/certificates/generate", {
      material: certificate.materialType,
      quantity: certificate.quantityReused,
      seller: certificate.sellerCompanyName,
      buyer: certificate.buyerCompanyName,
      transporter: certificate.transporterName
    }), "Digital certificate generated");
    reload();
  }

  return (
    <DashboardShell title="Digital Waste Certificate" userRole="admin" active="Certificates">
      <Panel className="mx-auto max-w-[880px] p-10">
        {loading && <LoadingState />}
        <Alert tone="red">{error || action.error}</Alert>
        <Alert>{action.message}</Alert>
        <div className="text-center">
          <h1 className="text-3xl font-extrabold uppercase tracking-normal text-brand-700">Digital Waste Reuse Certificate</h1>
          <p className="mt-3 text-sm font-bold text-muted">Certificate No: {certificate.certificateNumber}</p>
        </div>

        <div className="mx-auto mt-10 max-w-[640px] rounded-lg border border-line bg-slate-50 p-8">
          <dl className="grid gap-5 sm:grid-cols-[220px_1fr]">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-sm font-extrabold text-ink">{label}</dt>
                <dd className="text-sm font-semibold text-muted">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mx-auto mt-9 grid max-w-[640px] items-center gap-8 sm:grid-cols-[1fr_1fr_120px]">
          <ActionButton icon={buttonIcons.download} onClick={generateCertificate} disabled={action.busy}>
            {action.busy ? "Generating..." : "Generate Certificate"}
          </ActionButton>
          <ActionButton variant="outline" icon={buttonIcons.qr} onClick={() => action.run(() => api.get(`/certificates/verify/${certificate.certificateNumber}`), "Certificate verified")}>Verify QR</ActionButton>
          {certificate.qrCodeDataUrl ? (
            <img src={certificate.qrCodeDataUrl} alt={`QR verification for ${certificate.certificateNumber}`} className="h-28 w-28 rounded-md border border-line bg-white p-1" />
          ) : (
            <QrPattern />
          )}
        </div>
        {certificate.verificationUrl && (
          <p className="mt-5 break-all text-center text-xs font-semibold text-muted">{certificate.verificationUrl}</p>
        )}
      </Panel>
    </DashboardShell>
  );
}
