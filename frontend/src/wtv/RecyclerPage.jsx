import { useState } from "react";
import { Badge, CertCard, Empty, MaterialGallery, MaterialPhoto, Pipeline, Tabs } from "./ui.jsx";
import { LISTING_STATUS, REQ_STATUS, categoryName, formatDate, formatPrice, formatQuantity, sameId, whatsappListingLink } from "./data.js";

export default function RecyclerPage({ data, api, refresh, toast, user }) {
  const [tab, setTab] = useState("market");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");

  const requests = data.requests || [];
  const certificates = data.certificates || [];
  const activeRequestListingIds = requests
    .filter((request) => ["PENDING", "APPROVED"].includes(String(request.status).toUpperCase()))
    .map((request) => request.listingId);

  const marketplace = (data.marketplace || [])
    .filter((listing) => !activeRequestListingIds.some((id) => sameId(id, listing.id)))
    .filter((listing) => cat === "all" || sameId(listing.categoryId, cat))
    .filter((listing) => {
      const term = q.trim().toLowerCase();
      if (!term) return true;
      return `${listing.title} ${listing.location} ${categoryName(listing)}`.toLowerCase().includes(term);
    });

  const toConfirm = requests.filter((request) => (
    String(request.status).toUpperCase() === "APPROVED" &&
    String(request.listing?.status || "").toUpperCase() === "DELIVERED"
  ));

  const tabs = [
    { k: "market", label: "Marketplace", count: marketplace.length || null },
    { k: "reqs", label: "My Requests", count: requests.length || null },
    { k: "confirm", label: "Confirm Receipt", count: toConfirm.length || null },
    { k: "certs", label: "Certificates", count: certificates.length || null }
  ];

  return (
    <div className="page">
      <div className="page-h">Recycler / SME Dashboard</div>
      <div className="page-sub">Find approved materials, request supply, track movement, and confirm delivered waste for certification.</div>
      <Tabs tabs={tabs} active={tab} set={setTab} />

      {tab === "market" && (
        <>
          <div className="toolbar">
            <input className="input search" placeholder="Search by name, category, or location" value={q} onChange={(event) => setQ(event.target.value)} />
            <select className="input select-compact" value={cat} onChange={(event) => setCat(event.target.value)}>
              <option value="all">All categories</option>
              {(data.categories || []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          {marketplace.length ? (
            <div className="grid g2">
              {marketplace.map((listing) => (
                <MarketplaceCard key={listing.id} listing={listing} api={api} refresh={refresh} toast={toast} user={user} />
              ))}
            </div>
          ) : (
            <Empty title="No available materials" sub="Try a different search or wait for admin-approved listings." />
          )}
        </>
      )}

      {tab === "reqs" && (
        requests.length ? (
          <div className="grid g2">
            {requests.map((request) => (
              <div className="card" key={request.id}>
                <div className="card-head">
                  <div className="card-t">{request.listing?.title || "Material request"}</div>
                  <Badge map={REQ_STATUS} status={request.status} />
                </div>
                <div className="card-meta roomy">
                  <span><b>Quantity:</b> {request.listing ? formatQuantity(request.listing) : "Unknown"}</span>
                  <span><b>Price:</b> {request.listing ? formatPrice(request.listing) : "Unknown"}</span>
                  <span><b>Location:</b> {request.listing?.location || "Unknown"}</span>
                  <span><b>Category:</b> {categoryName(request.listing)}</span>
                </div>
                <div className="request-details">
                  <div className="profile-title">Submitted Request Details</div>
                  <div className="detail-grid">
                    <Detail label="Requested quantity" value={requestQuantity(request)} />
                    <Detail label="Proposed price" value={requestPrice(request, request.listing)} />
                    <Detail label="Contact name" value={request.contactName} />
                    <Detail label="Contact phone" value={request.contactPhone} />
                    <Detail label="Preferred pickup" value={formatDate(request.preferredPickupDate)} />
                    <Detail label="Delivery location" value={request.deliveryLocation} />
                    <Detail label="Message" value={request.message || "No message provided"} wide />
                  </div>
                </div>
                {request.decisionReason && (
                  <div className="decision-note">
                    <span>Producer reason</span>
                    <b>{request.decisionReason}</b>
                  </div>
                )}
                {request.listing && <Pipeline listing={request.listing} />}
              </div>
            ))}
          </div>
        ) : (
          <Empty title="No requests yet" sub="Go to Marketplace to request materials you need." />
        )
      )}

      {tab === "confirm" && (
        toConfirm.length ? (
          <div className="grid g2">
            {toConfirm.map((request) => (
              <ReceiptCard key={request.id} request={request} api={api} refresh={refresh} toast={toast} user={user} />
            ))}
          </div>
        ) : (
          <Empty title="Nothing waiting for confirmation" sub="Delivered material appears here before a certificate is issued." />
        )
      )}

      {tab === "certs" && (
        certificates.length ? (
          <div className="grid g2">{certificates.map((certificate) => <CertCard key={certificate.id} certificate={certificate} />)}</div>
        ) : (
          <Empty title="No certificates yet" sub="Confirm delivered materials to generate certificates." />
        )
      )}
    </div>
  );
}

function MarketplaceCard({ listing, api, refresh, toast, user }) {
  const [busy, setBusy] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const whatsappUrl = whatsappListingLink(listing);

  async function submitRequest(requestInfo) {
    setBusy(true);
    try {
      await api.post(`/listings/${listing.id}/requests`, requestInfo);
      toast("Request sent to producer");
      await refresh();
      return true;
    } catch (err) {
      toast(err.message || "Could not request material");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <MaterialPhoto listing={listing} />
      <div className="card-head">
        <div className="card-t">{listing.title}</div>
        {listing.quality && <span className="badge b-green"><span className="dot" />Quality {listing.quality}</span>}
      </div>
      <div className="card-meta roomy">
        <span><b>Category:</b> {categoryName(listing)}</span>
        <span><b>Quantity:</b> {formatQuantity(listing)}</span>
        <span><b>Price:</b> {formatPrice(listing)}</span>
        <span><b>Location:</b> {listing.location}</span>
        <span><b>Producer:</b> {listing.producerCompany?.name || "Unknown"}</span>
      </div>
      {listing.description && <p className="card-copy">{listing.description}</p>}
      <div className="row-actions">
        <button className="btn ghost sm" onClick={() => setDetailsOpen(true)}>View details</button>
        {whatsappUrl && <WhatsAppLink href={whatsappUrl} label="WhatsApp" />}
        <button className="btn sm" disabled={busy} onClick={() => setRequestOpen(true)}>Request this material</button>
      </div>

      {detailsOpen && (
        <MaterialDetailsModal
          listing={listing}
          busy={busy}
          onClose={() => setDetailsOpen(false)}
          onRequest={() => {
            setDetailsOpen(false);
            setRequestOpen(true);
          }}
        />
      )}

      {requestOpen && (
        <RequestMaterialModal
          listing={listing}
          user={user}
          busy={busy}
          onClose={() => setRequestOpen(false)}
          onSubmit={async (requestInfo) => {
            const requested = await submitRequest(requestInfo);
            if (requested) setRequestOpen(false);
          }}
        />
      )}
    </div>
  );
}

function RequestMaterialModal({ listing, user, busy, onClose, onSubmit }) {
  const [form, setForm] = useState({
    requestedQuantity: listing.quantity || "",
    requestedUnit: listing.unit || "KG",
    proposedPrice: listing.priceAmount || "",
    contactName: user?.name || "",
    contactPhone: "",
    preferredPickupDate: "",
    deliveryLocation: "",
    message: ""
  });

  function update(key) {
    return (event) => setForm({ ...form, [key]: event.target.value });
  }

  async function submit() {
    if (!form.requestedQuantity || Number(form.requestedQuantity) <= 0) {
      return;
    }
    if (!form.contactName.trim() || !form.contactPhone.trim()) {
      return;
    }

    await onSubmit({
      requestedQuantity: Number(form.requestedQuantity),
      requestedUnit: form.requestedUnit,
      proposedPrice: form.proposedPrice === "" ? null : Number(form.proposedPrice),
      contactName: form.contactName.trim(),
      contactPhone: form.contactPhone.trim(),
      preferredPickupDate: form.preferredPickupDate || null,
      deliveryLocation: form.deliveryLocation.trim() || null,
      message: form.message.trim() || null
    });
  }

  const canSubmit = Boolean(Number(form.requestedQuantity) > 0 && form.contactName.trim() && form.contactPhone.trim());

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Confirm material request">
      <div className="profile-modal request-modal">
        <div className="modal-head">
          <div>
            <div className="modal-kicker">Confirm Request</div>
            <h2>{listing.title}</h2>
            <p>Enter the request details the producer will review before approving or rejecting your request.</p>
          </div>
          <button className="btn ghost sm" onClick={onClose}>Close</button>
        </div>

        <div className="request-summary">
          <Detail label="Available quantity" value={formatQuantity(listing)} />
          <Detail label="Producer price" value={formatPrice(listing)} />
          <Detail label="Pickup location" value={listing.location} />
          <Detail label="Producer" value={listing.producerCompany?.name} />
        </div>

        <div className="form-grid inline-form">
          <div>
            <label className="stat-l" htmlFor={`request-qty-${listing.id}`}>Requested Quantity</label>
            <input id={`request-qty-${listing.id}`} className="input" type="number" min="1" max={listing.quantity || undefined} value={form.requestedQuantity} onChange={update("requestedQuantity")} />
          </div>
          <div>
            <label className="stat-l" htmlFor={`request-unit-${listing.id}`}>Unit</label>
            <select id={`request-unit-${listing.id}`} className="input" value={form.requestedUnit} onChange={update("requestedUnit")}>
              <option value="KG">kg</option>
              <option value="TONNE">tonnes</option>
              <option value="M3">m3</option>
            </select>
          </div>
          <div>
            <label className="stat-l" htmlFor={`request-price-${listing.id}`}>Proposed Price</label>
            <input id={`request-price-${listing.id}`} className="input" type="number" min="0" value={form.proposedPrice} onChange={update("proposedPrice")} placeholder="Optional" />
          </div>
          <div>
            <label className="stat-l" htmlFor={`request-date-${listing.id}`}>Preferred Pickup Date</label>
            <input id={`request-date-${listing.id}`} className="input" type="date" value={form.preferredPickupDate} onChange={update("preferredPickupDate")} />
          </div>
          <div>
            <label className="stat-l" htmlFor={`request-contact-${listing.id}`}>Contact Name</label>
            <input id={`request-contact-${listing.id}`} className="input" value={form.contactName} onChange={update("contactName")} placeholder="Your name" />
          </div>
          <div>
            <label className="stat-l" htmlFor={`request-phone-${listing.id}`}>Contact Phone</label>
            <input id={`request-phone-${listing.id}`} className="input" value={form.contactPhone} onChange={update("contactPhone")} placeholder="078..." />
          </div>
          <div className="full">
            <label className="stat-l" htmlFor={`request-delivery-${listing.id}`}>Delivery / Processing Location</label>
            <input id={`request-delivery-${listing.id}`} className="input" value={form.deliveryLocation} onChange={update("deliveryLocation")} placeholder="Where you want to receive or process this material" />
          </div>
          <div className="full">
            <label className="stat-l" htmlFor={`request-note-${listing.id}`}>Message to Producer</label>
            <textarea id={`request-note-${listing.id}`} className="input" value={form.message} onChange={update("message")} rows="3" placeholder="Add pickup plan, payment note, or any question for the producer" />
          </div>
        </div>

        <div className="row-actions modal-actions">
          <button className="btn sm" disabled={busy || !canSubmit} onClick={submit}>Submit Request</button>
          <button className="btn ghost sm" disabled={busy} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function MaterialDetailsModal({ listing, busy, onClose, onRequest }) {
  const producer = listing.producerCompany || {};
  const statusText = LISTING_STATUS[String(listing.status || "").toUpperCase()]?.t || listing.status || "Available";
  const whatsappUrl = whatsappListingLink(listing);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Material details">
      <div className="profile-modal material-modal">
        <div className="modal-head">
          <div>
            <div className="modal-kicker">Material Details</div>
            <h2>{listing.title}</h2>
            <p>Review the material, quality, source, and producer profile before sending your request.</p>
          </div>
          <button className="btn ghost sm" onClick={onClose}>Close</button>
        </div>

        <div className="material-modal-photo">
          <MaterialGallery listing={listing} />
        </div>

        <div className="trust-strip material-strip">
          <TrustStat label="Price" value={formatPrice(listing)} />
          <TrustStat label="Quantity" value={formatQuantity(listing)} />
          <TrustStat label="Quality" value={listing.quality ? `Grade ${listing.quality}` : "Pending"} />
          <TrustStat label="Posted" value={formatDate(listing.createdAt)} />
        </div>

        <div className="profile-layout">
          <section className="profile-panel">
            <div className="profile-title">Material Information</div>
            <div className="detail-grid">
              <Detail label="Category" value={categoryName(listing)} />
              <Detail label="Pickup location" value={listing.location} />
              <Detail label="Quantity" value={formatQuantity(listing)} />
              <Detail label="Price" value={formatPrice(listing)} />
              <Detail label="Quality grade" value={listing.quality ? `Grade ${listing.quality}` : "Pending"} />
              <Detail label="Status" value={statusText} />
              <Detail label="Posted" value={formatDate(listing.createdAt)} />
              <Detail label="Description" value={listing.description || "No description provided"} wide />
            </div>
          </section>

          <section className="profile-panel">
            <div className="profile-title">Producer Profile</div>
            <div className="detail-grid">
              <Detail label="Company" value={producer.name} />
              <Detail label="Business type" value={producer.type} />
              <Detail label="Approval status" value={producer.status} />
              <Detail label="Member since" value={formatDate(producer.createdAt)} />
              <Detail label="Email" value={producer.contactEmail} />
              <Detail label="Phone" value={producer.phone} />
            </div>
          </section>
        </div>

        <div className="row-actions modal-actions">
          {whatsappUrl && <WhatsAppLink href={whatsappUrl} label="Chat on WhatsApp" />}
          <button className="btn sm" disabled={busy} onClick={onRequest}>Request this material</button>
          <button className="btn ghost sm" disabled={busy} onClick={onClose}>Back to marketplace</button>
        </div>
      </div>
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

function TrustStat({ label, value }) {
  return (
    <div className="trust-stat">
      <span>{label}</span>
      <b>{value || "Not provided"}</b>
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

function requestQuantity(request) {
  if (!request?.requestedQuantity) return "Not provided";
  return `${Number(request.requestedQuantity).toLocaleString()} ${String(request.requestedUnit || "KG").toLowerCase()}`;
}

function requestPrice(request, listing) {
  if (!request?.proposedPrice) return "Not provided";
  return `${String(listing?.currency || "RWF").toUpperCase()} ${Number(request.proposedPrice).toLocaleString()}`;
}

function ReceiptCard({ request, api, refresh, toast, user }) {
  const [busy, setBusy] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const listing = request.listing;

  async function confirm(receiptInfo) {
    setBusy(true);
    try {
      await api.post(`/listings/${listing.id}/confirm-receipt`, receiptInfo);
      toast("Receipt confirmed and certificate issued");
      await refresh();
      return true;
    } catch (err) {
      toast(err.message || "Could not confirm receipt");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <MaterialPhoto listing={listing} compact />
      <div className="card-head">
        <div className="card-t">{listing.title}</div>
        <Badge map={LISTING_STATUS} status={listing.status} />
      </div>
      <div className="card-meta roomy">
        <span><b>Quantity:</b> {formatQuantity(listing)}</span>
        <span><b>Price:</b> {formatPrice(listing)}</span>
        <span><b>Location:</b> {listing.location}</span>
        <span><b>Category:</b> {categoryName(listing)}</span>
      </div>
      <div className="row-actions">
        <button className="btn green sm" disabled={busy} onClick={() => setReceiptOpen(true)}>Confirm receipt and issue certificate</button>
      </div>

      {receiptOpen && (
        <ReceiptConfirmationModal
          request={request}
          listing={listing}
          user={user}
          busy={busy}
          onClose={() => setReceiptOpen(false)}
          onSubmit={async (receiptInfo) => {
            const confirmed = await confirm(receiptInfo);
            if (confirmed) setReceiptOpen(false);
          }}
        />
      )}
    </div>
  );
}

function ReceiptConfirmationModal({ request, listing, user, busy, onClose, onSubmit }) {
  const [form, setForm] = useState({
    receivedQuantity: request.requestedQuantity || listing.quantity || "",
    receivedUnit: request.requestedUnit || listing.unit || "KG",
    receiptCondition: "GOOD",
    receiverName: request.contactName || user?.name || "",
    receiverPhone: request.contactPhone || "",
    receiptLocation: request.deliveryLocation || listing.location || "",
    receiptNotes: "",
    finalApproval: false
  });

  function update(key) {
    return (event) => {
      const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
      setForm({ ...form, [key]: value });
    };
  }

  async function submit() {
    if (!canSubmit) return;
    await onSubmit({
      receivedQuantity: Number(form.receivedQuantity),
      receivedUnit: form.receivedUnit,
      receiptCondition: form.receiptCondition,
      receiverName: form.receiverName.trim(),
      receiverPhone: form.receiverPhone.trim(),
      receiptLocation: form.receiptLocation.trim(),
      receiptNotes: form.receiptNotes.trim() || null,
      finalApproval: form.finalApproval
    });
  }

  const canSubmit = Boolean(
    Number(form.receivedQuantity) > 0 &&
    form.receiptCondition &&
    form.receiverName.trim() &&
    form.receiverPhone.trim() &&
    form.receiptLocation.trim() &&
    form.finalApproval
  );

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Final receipt confirmation">
      <div className="profile-modal receipt-modal">
        <div className="modal-head">
          <div>
            <div className="modal-kicker">Final Receipt Approval</div>
            <h2>{listing.title}</h2>
            <p>Confirm what was actually received. The system will use this information to certify the material movement.</p>
          </div>
          <button className="btn ghost sm" onClick={onClose}>Close</button>
        </div>

        <div className="request-summary">
          <Detail label="Delivered material" value={listing.title} />
          <Detail label="Expected quantity" value={formatQuantity(listing)} />
          <Detail label="Requested quantity" value={requestQuantity(request)} />
          <Detail label="Producer" value={listing.producerCompany?.name || "Producer"} />
        </div>

        <div className="form-grid inline-form">
          <div>
            <label className="stat-l" htmlFor={`receipt-qty-${listing.id}`}>Received Quantity</label>
            <input id={`receipt-qty-${listing.id}`} className="input" type="number" min="1" max={listing.quantity || undefined} value={form.receivedQuantity} onChange={update("receivedQuantity")} />
          </div>
          <div>
            <label className="stat-l" htmlFor={`receipt-unit-${listing.id}`}>Unit</label>
            <select id={`receipt-unit-${listing.id}`} className="input" value={form.receivedUnit} onChange={update("receivedUnit")}>
              <option value="KG">kg</option>
              <option value="TONNE">tonnes</option>
              <option value="M3">m3</option>
            </select>
          </div>
          <div>
            <label className="stat-l" htmlFor={`receipt-condition-${listing.id}`}>Condition on Receipt</label>
            <select id={`receipt-condition-${listing.id}`} className="input" value={form.receiptCondition} onChange={update("receiptCondition")}>
              <option value="GOOD">Good and accepted</option>
              <option value="PARTIAL">Partial quantity accepted</option>
              <option value="DAMAGED">Damaged but accepted</option>
              <option value="CONTAMINATED">Contaminated but accepted</option>
            </select>
          </div>
          <div>
            <label className="stat-l" htmlFor={`receipt-location-${listing.id}`}>Receipt Location</label>
            <input id={`receipt-location-${listing.id}`} className="input" value={form.receiptLocation} onChange={update("receiptLocation")} />
          </div>
          <div>
            <label className="stat-l" htmlFor={`receipt-name-${listing.id}`}>Receiver Name</label>
            <input id={`receipt-name-${listing.id}`} className="input" value={form.receiverName} onChange={update("receiverName")} />
          </div>
          <div>
            <label className="stat-l" htmlFor={`receipt-phone-${listing.id}`}>Receiver Phone</label>
            <input id={`receipt-phone-${listing.id}`} className="input" value={form.receiverPhone} onChange={update("receiverPhone")} placeholder="078..." />
          </div>
          <div className="full">
            <label className="stat-l" htmlFor={`receipt-notes-${listing.id}`}>Receipt Notes</label>
            <textarea id={`receipt-notes-${listing.id}`} className="input" value={form.receiptNotes} onChange={update("receiptNotes")} rows="3" placeholder="Short note about received condition, sorting, or any mismatch" />
          </div>
          <label className="check-row full">
            <input type="checkbox" checked={form.finalApproval} onChange={update("finalApproval")} />
            <span>I confirm this material was received and should be certified by the system.</span>
          </label>
        </div>

        <div className="row-actions modal-actions">
          <button className="btn green sm" disabled={busy || !canSubmit} onClick={submit}>Final approve and issue certificate</button>
          <button className="btn ghost sm" disabled={busy} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
