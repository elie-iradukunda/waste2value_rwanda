import { useEffect, useMemo, useState } from "react";
import PublicLayout from "../components/PublicLayout";
import { Alert, LoadingState, Panel, QrPattern } from "../components/dashboard/ui";
import { useAction } from "../hooks/useApi";
import { api } from "../lib/api";

export default function DigitalCertificate() {
  const verificationNumber = useMemo(() => new URLSearchParams(window.location.search).get("verify"), []);
  const [certificate, setCertificate] = useState(null);
  const action = useAction();

  useEffect(() => {
    if (!verificationNumber) return;
    action.run(async () => {
      const payload = await api.get(`/certificates/verify/${verificationNumber}`);
      setCertificate(payload.certificate);
      return { ...payload, message: payload.verified ? "Certificate verified successfully" : "Certificate could not be verified" };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationNumber]);

  return (
    <PublicLayout>
      <Panel className="mx-auto max-w-[880px] p-10">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold uppercase tracking-normal text-brand-700">Digital Waste Reuse Certificate</h1>
          <p className="mt-3 text-sm font-bold text-muted">Scan a certificate QR code, or open its verification link, to confirm authenticity here.</p>
        </div>

        {action.busy && <div className="mt-8"><LoadingState label="Verifying certificate..." /></div>}
        <div className="mt-6">
          <Alert tone="red">{action.error}</Alert>
          <Alert>{action.message}</Alert>
        </div>

        {!verificationNumber && !certificate && (
          <p className="mt-8 text-center text-sm font-semibold text-muted">No certificate number was provided in this link.</p>
        )}

        {certificate && (
          <>
            <p className="mt-6 text-center text-sm font-bold text-muted">Certificate No: {certificate.certificateNumber}</p>
            <div className="mx-auto mt-6 max-w-[640px] rounded-lg border border-line bg-slate-50 p-8">
              <dl className="grid gap-5 sm:grid-cols-[220px_1fr]">
                {[
                  ["Waste Material", certificate.materialType],
                  ["Quantity Reused", certificate.quantityReused],
                  ["Waste Producer", certificate.sellerCompanyName],
                  ["Buyer / Recycler", certificate.buyerCompanyName],
                  ["Transport Provider", certificate.transporterName],
                  ["Delivery Status", certificate.deliveryStatus],
                  ["Issue Date", certificate.issueDate]
                ].map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-sm font-extrabold text-ink">{label}</dt>
                    <dd className="text-sm font-semibold text-muted">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="mx-auto mt-8 flex justify-center">
              {certificate.qrCodeDataUrl ? (
                <img src={certificate.qrCodeDataUrl} alt={`QR verification for ${certificate.certificateNumber}`} className="h-28 w-28 rounded-md border border-line bg-white p-1" />
              ) : (
                <QrPattern />
              )}
            </div>
          </>
        )}
      </Panel>
    </PublicLayout>
  );
}
