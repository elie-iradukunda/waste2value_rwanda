import { Fragment, useState } from "react";
import { Badge, Empty, MaterialGallery, MaterialPhoto, Tabs } from "./ui.jsx";
import { JOB_STATUS, categoryName, formatDate, formatPrice, formatQuantity, whatsappPhone } from "./data.js";

const NEXT_LABEL = {
  WAITING: "Record pickup",
  PICKED_UP: "Start transit",
  IN_TRANSIT: "Record delivery"
};

const ORDER = ["WAITING", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];
const CONDITIONS = [
  ["GOOD", "Good condition"],
  ["PARTIAL", "Partial / mismatch"],
  ["DAMAGED", "Damaged"],
  ["CONTAMINATED", "Contaminated"]
];
const MAX_SOURCE_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_ENCODED_PROOF_LENGTH = 1_200_000;

export default function TransportPage({ data, api, refresh, toast, user }) {
  const [tab, setTab] = useState("active");
  const jobs = data.jobs || [];
  const active = jobs.filter((job) => String(job.status).toUpperCase() !== "DELIVERED");
  const done = jobs.filter((job) => String(job.status).toUpperCase() === "DELIVERED");

  const tabs = [
    { k: "active", label: "Active Jobs", count: active.length || null },
    { k: "done", label: "Completed", count: done.length || null }
  ];

  return (
    <div className="page">
      <div className="page-h">Transport Staff Dashboard</div>
      <div className="page-sub">Prepare assigned pickups, capture movement proof, contact companies, and confirm delivery for recycler receipt.</div>
      <Tabs tabs={tabs} active={tab} set={setTab} />

      {tab === "active" && (
        active.length ? (
          <div className="grid g2">
            {active.map((job) => (
              <TransportJobCard key={job.id} job={job} api={api} refresh={refresh} toast={toast} user={user} />
            ))}
          </div>
        ) : (
          <Empty title="No jobs waiting" sub="Approved producer requests automatically create jobs for your transport team." />
        )
      )}

      {tab === "done" && (
        done.length ? (
          <div className="grid g2">
            {done.map((job) => (
              <TransportJobCard key={job.id} job={job} completed />
            ))}
          </div>
        ) : (
          <Empty title="No completed jobs yet" sub="Delivered jobs with movement proof will appear here." />
        )
      )}
    </div>
  );
}

function TransportJobCard({ job, api, refresh, toast, user, completed = false }) {
  const [busy, setBusy] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState("");
  const listing = job.listing || {};
  const request = approvedRequestFor(job);
  const status = String(job.status).toUpperCase();
  const order = ORDER.indexOf(status);

  async function advance(payload = {}) {
    setBusy(true);
    try {
      await api.post(`/transport/jobs/${job.id}/advance`, payload);
      toast(status === "IN_TRANSIT" ? "Delivery recorded. Recycler can now confirm receipt" : "Transport status updated");
      await refresh();
      setActionOpen("");
      return true;
    } catch (err) {
      toast(err.message || "Could not update transport job");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function startAction() {
    if (status === "WAITING") {
      setActionOpen("pickup");
      return;
    }
    if (status === "IN_TRANSIT") {
      setActionOpen("delivery");
      return;
    }
    advance();
  }

  return (
    <div className="card">
      {listing.id && <MaterialPhoto listing={listing} compact />}
      <div className="card-head">
        <div className="card-t">{listing.title || "Transport job"}</div>
        <Badge map={JOB_STATUS} status={job.status} />
      </div>
      <div className="card-meta roomy">
        <span><b>Quantity:</b> {listing.id ? formatQuantity(listing) : "Unknown"}</span>
        <span><b>Price:</b> {listing.id ? formatPrice(listing) : "Unknown"}</span>
        <span><b>Pickup:</b> {job.pickupLocation || listing.location || "Unknown"}</span>
        <span><b>Dropoff:</b> {job.dropoffLocation || job.deliveryLocation || request?.deliveryLocation || "Not set"}</span>
        <span><b>Category:</b> {categoryName(listing)}</span>
        <span><b>Assignment:</b> {job.providerCompany?.name ? `${job.providerCompany.name} transport team` : "Assigned to your team"}</span>
      </div>

      <div className="pipe">
        {ORDER.map((step, index) => (
          <Fragment key={step}>
            {index > 0 && <div className="pipe-line" />}
            <div className={`pipe-step ${index < order ? "done" : index === order ? "current" : ""}`}>
              <span className="pd">{index < order ? "OK" : index + 1}</span>
              {JOB_STATUS[step].t}
            </div>
          </Fragment>
        ))}
      </div>

      {completed && <MovementSummary job={job} />}

      <div className="row-actions">
        <button className="btn ghost sm" onClick={() => setDetailsOpen(true)}>View full details</button>
        {!completed && NEXT_LABEL[status] && (
          <button className="btn sm" disabled={busy} onClick={startAction}>{NEXT_LABEL[status]}</button>
        )}
      </div>

      {detailsOpen && <TransportDetailsModal job={job} onClose={() => setDetailsOpen(false)} />}
      {actionOpen && (
        <TransportActionModal
          job={job}
          user={user}
          toast={toast}
          mode={actionOpen}
          busy={busy}
          onClose={() => setActionOpen("")}
          onSubmit={advance}
        />
      )}
    </div>
  );
}

function TransportActionModal({ job, user, toast, mode, busy, onClose, onSubmit }) {
  const listing = job.listing || {};
  const request = approvedRequestFor(job);
  const isPickup = mode === "pickup";
  const [imageBusy, setImageBusy] = useState(false);
  const [form, setForm] = useState({
    driverName: job.driverName || user?.name || "",
    driverPhone: job.driverPhone || "",
    vehiclePlate: job.vehiclePlate || "",
    pickupQuantity: job.pickupQuantity || listing.quantity || "",
    pickupUnit: job.pickupUnit || listing.unit || "KG",
    pickupCondition: job.pickupCondition || "GOOD",
    pickupNotes: job.pickupNotes || "",
    pickupPhotoDataUrl: job.pickupPhotoDataUrl || "",
    deliveryQuantity: job.deliveryQuantity || job.pickupQuantity || request?.requestedQuantity || listing.quantity || "",
    deliveryUnit: job.deliveryUnit || job.pickupUnit || request?.requestedUnit || listing.unit || "KG",
    deliveryCondition: job.deliveryCondition || "GOOD",
    deliveryLocation: job.deliveryLocation || job.dropoffLocation || request?.deliveryLocation || listing.location || "",
    receiverName: job.receiverName || request?.contactName || "",
    receiverPhone: job.receiverPhone || request?.contactPhone || "",
    deliveryNotes: job.deliveryNotes || "",
    deliveryPhotoDataUrl: job.deliveryPhotoDataUrl || ""
  });

  function update(key) {
    return (event) => setForm({ ...form, [key]: event.target.value });
  }

  async function chooseProof(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImageBusy(true);
    try {
      const imageDataUrl = await compressProofImage(file);
      setForm((current) => ({ ...current, [isPickup ? "pickupPhotoDataUrl" : "deliveryPhotoDataUrl"]: imageDataUrl }));
    } catch (err) {
      toast(err.message || "Could not prepare proof photo");
    } finally {
      setImageBusy(false);
    }
  }

  function submit() {
    if (!canSubmit) return;

    if (isPickup) {
      onSubmit({
        driverName: form.driverName.trim(),
        driverPhone: form.driverPhone.trim(),
        vehiclePlate: form.vehiclePlate.trim(),
        pickupQuantity: Number(form.pickupQuantity),
        pickupUnit: form.pickupUnit,
        pickupCondition: form.pickupCondition,
        pickupNotes: form.pickupNotes.trim() || null,
        pickupPhotoDataUrl: form.pickupPhotoDataUrl || null
      });
      return;
    }

    onSubmit({
      deliveryQuantity: Number(form.deliveryQuantity),
      deliveryUnit: form.deliveryUnit,
      deliveryCondition: form.deliveryCondition,
      deliveryLocation: form.deliveryLocation.trim(),
      receiverName: form.receiverName.trim(),
      receiverPhone: form.receiverPhone.trim(),
      deliveryNotes: form.deliveryNotes.trim() || null,
      deliveryPhotoDataUrl: form.deliveryPhotoDataUrl || null
    });
  }

  const proofImage = isPickup ? form.pickupPhotoDataUrl : form.deliveryPhotoDataUrl;
  const canSubmit = isPickup
    ? Boolean(form.driverName.trim() && form.driverPhone.trim() && form.vehiclePlate.trim() && Number(form.pickupQuantity) > 0 && form.pickupCondition)
    : Boolean(Number(form.deliveryQuantity) > 0 && form.deliveryCondition && form.deliveryLocation.trim() && form.receiverName.trim() && form.receiverPhone.trim());

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={isPickup ? "Record pickup proof" : "Record delivery proof"}>
      <div className="profile-modal movement-modal">
        <div className="modal-head">
          <div>
            <div className="modal-kicker">{isPickup ? "Pickup Proof" : "Delivery Proof"}</div>
            <h2>{listing.title || "Transport job"}</h2>
            <p>{isPickup ? "Capture the driver, vehicle, quantity, condition, and optional loading photo." : "Capture receiver details, dropoff location, final quantity, condition, and optional delivery photo."}</p>
          </div>
          <button className="btn ghost sm" onClick={onClose}>Close</button>
        </div>

        <div className="request-summary">
          <Detail label="Material" value={listing.title} />
          <Detail label="Expected quantity" value={listing.id ? formatQuantity(listing) : "Unknown"} />
          <Detail label="Pickup" value={job.pickupLocation || listing.location} />
          <Detail label="Buyer location" value={request?.deliveryLocation || job.dropoffLocation} />
        </div>

        {isPickup ? (
          <div className="form-grid inline-form">
            <Input label="Driver Name" value={form.driverName} onChange={update("driverName")} />
            <Input label="Driver Phone" value={form.driverPhone} onChange={update("driverPhone")} placeholder="078..." />
            <Input label="Vehicle Plate" value={form.vehiclePlate} onChange={update("vehiclePlate")} placeholder="RAB 123 A" />
            <Input label="Pickup Quantity" type="number" min="1" max={listing.quantity || undefined} value={form.pickupQuantity} onChange={update("pickupQuantity")} />
            <UnitSelect label="Unit" value={form.pickupUnit} onChange={update("pickupUnit")} />
            <ConditionSelect label="Pickup Condition" value={form.pickupCondition} onChange={update("pickupCondition")} />
            <TextArea label="Pickup Notes" value={form.pickupNotes} onChange={update("pickupNotes")} />
          </div>
        ) : (
          <div className="form-grid inline-form">
            <Input label="Receiver Name" value={form.receiverName} onChange={update("receiverName")} />
            <Input label="Receiver Phone" value={form.receiverPhone} onChange={update("receiverPhone")} placeholder="078..." />
            <Input label="Delivery Quantity" type="number" min="1" max={job.pickupQuantity || listing.quantity || undefined} value={form.deliveryQuantity} onChange={update("deliveryQuantity")} />
            <UnitSelect label="Unit" value={form.deliveryUnit} onChange={update("deliveryUnit")} />
            <ConditionSelect label="Delivery Condition" value={form.deliveryCondition} onChange={update("deliveryCondition")} />
            <Input label="Delivery Location" value={form.deliveryLocation} onChange={update("deliveryLocation")} />
            <TextArea label="Delivery Notes" value={form.deliveryNotes} onChange={update("deliveryNotes")} />
          </div>
        )}

        <div className="proof-upload-block">
          <label className="stat-l">{isPickup ? "Loading Photo" : "Delivery Photo"}</label>
          <div className="upload-grid">
            <label className="upload-box">
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseProof} disabled={imageBusy || busy} />
              <span>{imageBusy ? "Preparing photo..." : "Choose proof photo from PC"}</span>
              <small>Optional PNG, JPG or WEBP proof image.</small>
            </label>
            {proofImage && (
              <div className="upload-preview proof-preview">
                <img src={proofImage} alt={isPickup ? "Pickup proof" : "Delivery proof"} />
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => setForm((current) => ({ ...current, [isPickup ? "pickupPhotoDataUrl" : "deliveryPhotoDataUrl"]: "" }))}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="row-actions modal-actions">
          <button className="btn green sm" disabled={busy || imageBusy || !canSubmit} onClick={submit}>
            {isPickup ? "Save pickup proof" : "Save delivery proof"}
          </button>
          <button className="btn ghost sm" disabled={busy} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function TransportDetailsModal({ job, onClose }) {
  const listing = job.listing || {};
  const request = approvedRequestFor(job);
  const producer = listing.producerCompany || {};
  const recyclerCompany = request?.recyclerCompany || {};
  const provider = job.providerCompany || {};
  const pickupMap = mapLink(job.pickupLocation || listing.location);
  const dropoffMap = mapLink(job.deliveryLocation || job.dropoffLocation || request?.deliveryLocation);
  const producerWhatsApp = whatsappContactLink(producer.phone, `Hello ${producer.name || "producer"}, I am the transport staff member for ${listing.title || "your material"} on Waste to Value.`);
  const recyclerWhatsApp = whatsappContactLink(recyclerCompany.phone || request?.contactPhone, `Hello ${recyclerCompany.name || request?.contactName || "buyer"}, I am the transport staff member for ${listing.title || "your material"} on Waste to Value.`);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Transport job details">
      <div className="profile-modal transport-details-modal">
        <div className="modal-head">
          <div>
            <div className="modal-kicker">Transport Job Details</div>
            <h2>{listing.title || "Transport job"}</h2>
            <p>Review the full material, producer, buyer, route, and movement proof before moving this job forward.</p>
          </div>
          <button className="btn ghost sm" onClick={onClose}>Close</button>
        </div>

        {listing.id && (
          <div className="material-modal-photo">
            <MaterialGallery listing={listing} />
          </div>
        )}

        <div className="profile-layout transport-detail-layout">
          <section className="profile-panel">
            <div className="profile-title">Material</div>
            <div className="detail-grid">
              <Detail label="Category" value={categoryName(listing)} />
              <Detail label="Quantity" value={listing.id ? formatQuantity(listing) : "Unknown"} />
              <Detail label="Price" value={listing.id ? formatPrice(listing) : "Unknown"} />
              <Detail label="Quality" value={listing.quality ? `Grade ${listing.quality}` : "Not graded"} />
              <Detail label="Pickup location" value={job.pickupLocation || listing.location} />
              <Detail label="Dropoff location" value={job.deliveryLocation || job.dropoffLocation || request?.deliveryLocation} />
              <Detail label="Description" value={listing.description} wide />
            </div>
          </section>

          <section className="profile-panel">
            <div className="profile-title">Producer</div>
            <div className="detail-grid">
              <Detail label="Company" value={producer.name} />
              <Detail label="Status" value={producer.status} />
              <Detail label="Email" value={producer.contactEmail} />
              <Detail label="Phone" value={producer.phone} />
            </div>
          </section>

          <section className="profile-panel">
            <div className="profile-title">Approved Buyer</div>
            <div className="detail-grid">
              <Detail label="Recycler company" value={recyclerCompany.name} />
              <Detail label="Contact person" value={request?.contactName || request?.createdBy?.name} />
              <Detail label="Phone" value={request?.contactPhone || recyclerCompany.phone} />
              <Detail label="Requested quantity" value={requestQuantity(request, listing)} />
              <Detail label="Delivery location" value={request?.deliveryLocation} />
              <Detail label="Message" value={request?.message} wide />
            </div>
          </section>

          <section className="profile-panel">
            <div className="profile-title">Transport Staff</div>
            <div className="detail-grid">
              <Detail label="Company" value={provider.name || (job.providerCompanyId ? "Assigned company" : "Not claimed yet")} />
              <Detail label="Handled by" value={job.handledBy?.name || job.driverName} />
              <Detail label="Driver phone" value={job.driverPhone} />
              <Detail label="Vehicle plate" value={job.vehiclePlate} />
            </div>
          </section>

          <section className="profile-panel wide-panel">
            <div className="profile-title">Movement Proof</div>
            <div className="proof-stack">
              <ProofPanel title="Pickup" job={job} type="pickup" />
              <ProofPanel title="Delivery" job={job} type="delivery" />
            </div>
          </section>
        </div>

        <div className="row-actions modal-actions">
          {producerWhatsApp && <WhatsAppLink href={producerWhatsApp} label="Producer WhatsApp" />}
          {recyclerWhatsApp && <WhatsAppLink href={recyclerWhatsApp} label="Buyer WhatsApp" />}
          {pickupMap && <MapLink href={pickupMap} label="Pickup map" />}
          {dropoffMap && <MapLink href={dropoffMap} label="Dropoff map" />}
          <button className="btn ghost sm" onClick={onClose}>Close details</button>
        </div>
      </div>
    </div>
  );
}

function MovementSummary({ job }) {
  return (
    <div className="movement-summary">
      <div className="profile-title">Movement proof</div>
      <div className="detail-grid">
        <Detail label="Driver" value={job.driverName} />
        <Detail label="Vehicle" value={job.vehiclePlate} />
        <Detail label="Picked up" value={formatDate(job.pickedUpAt)} />
        <Detail label="Delivered" value={formatDate(job.deliveredAt)} />
        <Detail label="Receiver" value={job.receiverName} />
        <Detail label="Delivery condition" value={conditionLabel(job.deliveryCondition)} />
      </div>
    </div>
  );
}

function ProofPanel({ title, job, type }) {
  const isPickup = type === "pickup";
  const quantity = isPickup
    ? movementQuantity(job.pickupQuantity, job.pickupUnit)
    : movementQuantity(job.deliveryQuantity, job.deliveryUnit);
  const photo = isPickup ? job.pickupPhotoDataUrl : job.deliveryPhotoDataUrl;

  return (
    <div className="proof-panel">
      <div className="profile-title">{title}</div>
      <div className="detail-grid">
        {isPickup ? (
          <>
            <Detail label="Driver" value={job.driverName} />
            <Detail label="Driver phone" value={job.driverPhone} />
            <Detail label="Vehicle plate" value={job.vehiclePlate} />
            <Detail label="Pickup quantity" value={quantity} />
            <Detail label="Pickup condition" value={conditionLabel(job.pickupCondition)} />
            <Detail label="Picked up on" value={formatDate(job.pickedUpAt)} />
            <Detail label="Notes" value={job.pickupNotes} wide />
          </>
        ) : (
          <>
            <Detail label="Receiver" value={job.receiverName} />
            <Detail label="Receiver phone" value={job.receiverPhone} />
            <Detail label="Delivery quantity" value={quantity} />
            <Detail label="Delivery condition" value={conditionLabel(job.deliveryCondition)} />
            <Detail label="Delivery location" value={job.deliveryLocation || job.dropoffLocation} />
            <Detail label="Delivered on" value={formatDate(job.deliveredAt)} />
            <Detail label="Notes" value={job.deliveryNotes} wide />
          </>
        )}
      </div>
      {photo ? (
        <div className="proof-photo">
          <img src={photo} alt={`${title} proof`} />
        </div>
      ) : (
        <div className="proof-photo empty-proof">No proof photo uploaded</div>
      )}
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="stat-l">{label}</label>
      <input className="input" {...props} />
    </div>
  );
}

function TextArea({ label, ...props }) {
  return (
    <div className="full">
      <label className="stat-l">{label}</label>
      <textarea className="input" rows="3" placeholder="Short proof note" {...props} />
    </div>
  );
}

function UnitSelect({ label, value, onChange }) {
  return (
    <div>
      <label className="stat-l">{label}</label>
      <select className="input" value={value} onChange={onChange}>
        <option value="KG">kg</option>
        <option value="TONNE">tonnes</option>
        <option value="M3">m3</option>
      </select>
    </div>
  );
}

function ConditionSelect({ label, value, onChange }) {
  return (
    <div>
      <label className="stat-l">{label}</label>
      <select className="input" value={value} onChange={onChange}>
        {CONDITIONS.map(([key, text]) => (
          <option key={key} value={key}>{text}</option>
        ))}
      </select>
    </div>
  );
}

function Detail({ label, value, wide = false }) {
  return (
    <div className={wide ? "detail-item wide" : "detail-item"}>
      <span>{label}</span>
      <b>{value || "Not provided"}</b>
    </div>
  );
}

function WhatsAppLink({ href, label }) {
  return (
    <a className="btn sm whatsapp-btn" href={href} target="_blank" rel="noreferrer">
      <span className="whatsapp-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M12.04 3.5a8.45 8.45 0 0 0-7.29 12.72L3.8 20.5l4.38-1.02A8.46 8.46 0 1 0 12.04 3.5Zm0 1.7a6.76 6.76 0 0 1 5.75 10.3 6.72 6.72 0 0 1-8.86 2.35l-.31-.18-2.46.58.53-2.4-.2-.32a6.75 6.75 0 0 1 5.55-10.33Zm-2.8 3.36c-.15 0-.38.05-.58.27-.2.22-.76.75-.76 1.82s.78 2.1.89 2.25c.11.14 1.52 2.43 3.77 3.31 1.87.73 2.25.59 2.65.55.41-.04 1.31-.54 1.5-1.06.18-.52.18-.96.13-1.06-.06-.09-.2-.15-.42-.26-.22-.11-1.31-.65-1.51-.72-.2-.08-.35-.11-.5.11-.15.22-.57.72-.7.87-.13.15-.26.17-.48.06-.22-.11-.93-.34-1.77-1.09-.65-.58-1.09-1.29-1.22-1.51-.13-.22-.01-.34.1-.45.1-.1.22-.26.33-.39.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.39-.06-.11-.5-1.2-.68-1.64-.18-.43-.36-.37-.5-.38h-.45Z" />
        </svg>
      </span>
      {label}
    </a>
  );
}

function MapLink({ href, label }) {
  return (
    <a className="btn ghost sm" href={href} target="_blank" rel="noreferrer">{label}</a>
  );
}

function approvedRequestFor(job) {
  const requests = job?.listing?.requests || [];
  return requests.find((request) => String(request.status).toUpperCase() === "APPROVED") || requests[0] || null;
}

function requestQuantity(request, listing) {
  if (!request?.requestedQuantity) return listing?.id ? formatQuantity(listing) : "Not provided";
  return `${Number(request.requestedQuantity).toLocaleString()} ${String(request.requestedUnit || listing?.unit || "KG").toLowerCase()}`;
}

function movementQuantity(quantity, unit) {
  if (!quantity) return "Not provided";
  return `${Number(quantity).toLocaleString()} ${String(unit || "KG").toLowerCase()}`;
}

function conditionLabel(value) {
  const found = CONDITIONS.find(([key]) => key === String(value || "").toUpperCase());
  return found?.[1] || value || "Not provided";
}

function mapLink(location) {
  if (!location) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

function whatsappContactLink(phone, message) {
  const cleanPhone = whatsappPhone(phone);
  if (!cleanPhone) return "";
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

function compressProofImage(file) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      reject(new Error("Choose a PNG, JPG or WEBP image"));
      return;
    }
    if (file.size > MAX_SOURCE_IMAGE_SIZE) {
      reject(new Error("Choose an image under 10 MB"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not prepare proof photo"));
      image.onload = () => {
        const maxSide = 900;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.fillStyle = "#0f172a";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.76);

        if (imageDataUrl.length > MAX_ENCODED_PROOF_LENGTH) {
          reject(new Error("Proof photo is still too large after compression"));
          return;
        }
        resolve(imageDataUrl);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
