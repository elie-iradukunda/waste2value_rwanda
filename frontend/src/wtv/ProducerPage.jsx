import { useEffect, useState } from "react";
import { Badge, CertCard, Empty, MaterialGallery, Pipeline, Tabs } from "./ui.jsx";
import { LISTING_STATUS, REQ_STATUS, categoryName, formatDate, formatNumber, formatPrice, formatQuantity } from "./data.js";

const MAX_SOURCE_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_ENCODED_IMAGE_LENGTH = 1_200_000;
const MAX_GALLERY_IMAGES = 6;

export default function ProducerPage({ data, api, refresh, toast }) {
  const [tab, setTab] = useState("mine");
  const listings = data.listings || [];
  const requests = data.requests || [];
  const certificates = data.certificates || [];
  const transportStaff = data.transportStaff || [];

  const tabs = [
    { k: "mine", label: "My Materials", count: listings.length || null },
    { k: "post", label: "Post Material" },
    { k: "requests", label: "Incoming Requests", count: requests.length || null },
    { k: "transport", label: "Transport Team", count: transportStaff.length || null },
    { k: "certs", label: "Certificates", count: certificates.length || null }
  ];

  return (
    <div className="page">
      <div className="page-h">Waste Producer Dashboard</div>
      <div className="page-sub">Post materials, update available listings, approve buyer requests, and track certificates.</div>
      <Tabs tabs={tabs} active={tab} set={setTab} />

      {tab === "mine" && (
        listings.length ? (
          <div className="grid g2">
            {listings.map((listing) => (
              <ProducerListing key={listing.id} listing={listing} api={api} refresh={refresh} toast={toast} />
            ))}
          </div>
        ) : (
          <Empty title="Nothing posted yet" sub="Go to Post Material to submit your first waste listing." />
        )
      )}

      {tab === "post" && (
        <PostWaste categories={data.categories || []} api={api} refresh={refresh} toast={toast} goto={() => setTab("mine")} />
      )}

      {tab === "requests" && (
        requests.length ? (
          <div className="grid g2">
            {requests.map((request) => (
              <IncomingRequest key={request.id} request={request} api={api} refresh={refresh} toast={toast} />
            ))}
          </div>
        ) : (
          <Empty title="No new requests" sub="Buyer requests for your approved listings will appear here." />
        )
      )}

      {tab === "transport" && (
        <TransportTeam staff={transportStaff} api={api} refresh={refresh} toast={toast} />
      )}

      {tab === "certs" && (
        certificates.length ? (
          <div className="grid g2">{certificates.map((certificate) => <CertCard key={certificate.id} certificate={certificate} />)}</div>
        ) : (
          <Empty title="No certificates yet" sub="Certificates are issued when a recycler confirms delivered material." />
        )
      )}
    </div>
  );
}

function ProducerListing({ listing, api, refresh, toast }) {
  const [edit, setEdit] = useState(false);
  const [quantity, setQuantity] = useState(listing.quantity);
  const [location, setLocation] = useState(listing.location);
  const [priceAmount, setPriceAmount] = useState(listing.priceAmount || "");
  const [currency, setCurrency] = useState(listing.currency || "RWF");
  const [priceType, setPriceType] = useState(listing.priceType || "PER_UNIT");
  const [busy, setBusy] = useState(false);
  const canEdit = ["PENDING_APPROVAL", "APPROVED"].includes(String(listing.status).toUpperCase());

  async function save() {
    setBusy(true);
    try {
      await api.patch(`/listings/${listing.id}`, {
        quantity: Number(quantity),
        location,
        priceAmount: priceAmount === "" ? null : Number(priceAmount),
        currency,
        priceType
      });
      toast("Material updated");
      setEdit(false);
      await refresh();
    } catch (err) {
      toast(err.message || "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <MaterialGallery listing={listing} />
      <div className="card-head">
        <div className="card-t">{listing.title}</div>
        <Badge map={LISTING_STATUS} status={listing.status} />
      </div>
      <div className="card-meta roomy">
        <span><b>Category:</b> {categoryName(listing)}</span>
        <span><b>Quantity:</b> {formatQuantity(listing)}</span>
        <span><b>Price:</b> {formatPrice(listing)}</span>
        <span><b>Location:</b> {listing.location}</span>
        {listing.quality && <span><b>Quality:</b> {listing.quality}</span>}
      </div>
      {listing.description && <p className="card-copy">{listing.description}</p>}
      <Pipeline listing={listing} />

      {edit && (
        <div className="form-grid inline-form">
          <div>
            <label className="stat-l">Quantity ({listing.unit})</label>
            <input className="input" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </div>
          <div>
            <label className="stat-l">Location</label>
            <input className="input" value={location} onChange={(event) => setLocation(event.target.value)} />
          </div>
          <div>
            <label className="stat-l">Price</label>
            <input className="input" type="number" min="0" value={priceAmount} onChange={(event) => setPriceAmount(event.target.value)} />
          </div>
          <div>
            <label className="stat-l">Price type</label>
            <select className="input" value={priceType} onChange={(event) => setPriceType(event.target.value)}>
              <option value="PER_UNIT">Per selected unit</option>
              <option value="TOTAL">Total lot price</option>
            </select>
          </div>
          <div>
            <label className="stat-l">Currency</label>
            <select className="input" value={currency} onChange={(event) => setCurrency(event.target.value)}>
              <option value="RWF">RWF</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
      )}

      {canEdit && (
        <div className="row-actions">
          {edit ? (
            <>
              <button className="btn green sm" disabled={busy} onClick={save}>Save</button>
              <button className="btn ghost sm" disabled={busy} onClick={() => setEdit(false)}>Cancel</button>
            </>
          ) : (
            <button className="btn ghost sm" onClick={() => setEdit(true)}>Update quantity / location / price</button>
          )}
        </div>
      )}
    </div>
  );
}

function PostWaste({ categories, api, refresh, toast, goto }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    quantity: "",
    unit: "KG",
    priceAmount: "",
    currency: "RWF",
    priceType: "PER_UNIT",
    location: "",
    imageGallery: []
  });
  const [busy, setBusy] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);

  useEffect(() => {
    if (!form.categoryId && categories[0]) {
      setForm((current) => ({ ...current, categoryId: String(categories[0].id) }));
    }
  }, [categories, form.categoryId]);

  function update(key) {
    return (event) => setForm({ ...form, [key]: event.target.value });
  }

  async function chooseImage(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    const slots = MAX_GALLERY_IMAGES - form.imageGallery.length;
    if (slots <= 0) {
      toast(`Upload up to ${MAX_GALLERY_IMAGES} material photos`);
      return;
    }

    setImageBusy(true);
    try {
      const prepared = [];
      for (const file of files.slice(0, slots)) {
        prepared.push(await compressImage(file));
      }
      setForm((current) => ({ ...current, imageGallery: [...current.imageGallery, ...prepared].slice(0, MAX_GALLERY_IMAGES) }));
      toast(prepared.length === 1 ? "Material photo added" : "Material photos added");
    } catch (err) {
      toast(err.message || "Could not load image");
    } finally {
      setImageBusy(false);
    }
  }

  async function submit() {
    if (!form.title.trim() || !form.categoryId || !form.quantity || !form.location.trim()) {
      toast("Please fill in all required fields");
      return;
    }
    const cleanPrice = Number(form.priceAmount);
    if (!Number.isFinite(cleanPrice) || cleanPrice <= 0) {
      toast("Please enter a valid material price");
      return;
    }

    setBusy(true);
    try {
      await api.post("/listings", {
        title: form.title.trim(),
        description: form.description.trim() || null,
        categoryId: Number(form.categoryId),
        quantity: Number(form.quantity),
        unit: form.unit,
        priceAmount: cleanPrice,
        currency: form.currency,
        priceType: form.priceType,
        location: form.location.trim(),
        imageDataUrl: form.imageGallery[0] || null,
        imageGallery: form.imageGallery
      });
      toast("Material posted and sent for admin approval");
      await refresh();
      goto();
    } catch (err) {
      toast(err.message || "Could not post material");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card form-card">
      <div className="card-t">Post New Material</div>
      <div className="page-sub">Admin approval and quality grading are required before a listing appears on the recycler marketplace.</div>
      <div className="form-grid inline-form">
        <div className="full">
          <label className="stat-l">Material Name</label>
          <input className="input" value={form.title} onChange={update("title")} placeholder="PET plastic bottles" />
        </div>
        <div className="full">
          <label className="stat-l">Description</label>
          <textarea className="input" value={form.description} onChange={update("description")} rows="3" placeholder="Sorted, clean, ready for pickup" />
        </div>
        <div className="full">
          <label className="stat-l">Material Photos</label>
          <div className="upload-grid">
            <label className="upload-box">
              <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={chooseImage} disabled={imageBusy || busy} />
              <span>{imageBusy ? "Preparing images..." : "Choose images from PC"}</span>
              <small>PNG, JPG or WEBP. Up to {MAX_GALLERY_IMAGES} photos.</small>
            </label>
            {form.imageGallery.length > 0 && (
              <div className="upload-preview-grid">
                {form.imageGallery.map((image, index) => (
                  <div className="upload-preview" key={`${image.slice(0, 48)}-${index}`}>
                    <img src={image} alt={`Selected material ${index + 1}`} />
                    <button
                      type="button"
                      className="btn ghost sm"
                      onClick={() => setForm((current) => ({
                        ...current,
                        imageGallery: current.imageGallery.filter((_, imageIndex) => imageIndex !== index)
                      }))}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="stat-l">Category</label>
          <select className="input" value={form.categoryId} onChange={update("categoryId")}>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </div>
        <div>
          <label className="stat-l">Location</label>
          <input className="input" value={form.location} onChange={update("location")} placeholder="Gikondo, Kigali" />
        </div>
        <div>
          <label className="stat-l">Quantity</label>
          <input className="input" type="number" value={form.quantity} onChange={update("quantity")} placeholder="0" />
        </div>
        <div>
          <label className="stat-l">Unit</label>
          <select className="input" value={form.unit} onChange={update("unit")}>
            <option value="KG">kg</option>
            <option value="TONNE">tonnes</option>
            <option value="M3">m3</option>
          </select>
        </div>
        <div>
          <label className="stat-l">Price</label>
          <input className="input" type="number" min="0" value={form.priceAmount} onChange={update("priceAmount")} placeholder="150" />
        </div>
        <div>
          <label className="stat-l">Currency</label>
          <select className="input" value={form.currency} onChange={update("currency")}>
            <option value="RWF">RWF</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div>
          <label className="stat-l">Price Type</label>
          <select className="input" value={form.priceType} onChange={update("priceType")}>
            <option value="PER_UNIT">Per selected unit</option>
            <option value="TOTAL">Total lot price</option>
          </select>
        </div>
      </div>
      <button className="btn" disabled={busy || !categories.length} onClick={submit}>Post Material</button>
    </div>
  );
}

function TransportTeam({ staff, api, refresh, toast }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [credentials, setCredentials] = useState(null);
  const [busy, setBusy] = useState(false);

  function update(key) {
    return (event) => setForm({ ...form, [key]: event.target.value });
  }

  async function submit() {
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password
    };

    if (!payload.name || !payload.email || !payload.password) {
      toast("Transport staff name, email and password are required");
      return;
    }
    if (payload.password.length < 6) {
      toast("Use at least 6 characters for the staff password");
      return;
    }

    setBusy(true);
    try {
      const created = await api.post("/producer/transport-staff", payload);
      setCredentials(created.credentials);
      setForm({ name: "", email: "", password: "" });
      toast("Transport staff account created");
      await refresh();
    } catch (err) {
      toast(err.message || "Could not create transport staff account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid g2">
      <div className="card form-card">
        <div className="card-t">Create Transport Staff Account</div>
        <div className="page-sub">These staff logins receive pickup and delivery jobs for your approved material requests.</div>
        <div className="form-grid inline-form">
          <div>
            <label className="stat-l">Staff Name</label>
            <input className="input" value={form.name} onChange={update("name")} placeholder="Driver full name" />
          </div>
          <div>
            <label className="stat-l">Email</label>
            <input className="input" value={form.email} onChange={update("email")} placeholder="driver@company.rw" />
          </div>
          <div className="full">
            <label className="stat-l">Temporary Password</label>
            <input className="input" type="text" value={form.password} onChange={update("password")} placeholder="At least 6 characters" />
          </div>
        </div>
        <button className="btn green" disabled={busy} onClick={submit}>
          {busy ? "Creating..." : "Create transport login"}
        </button>

        {credentials && (
          <div className="credential-card">
            <span>Give these credentials to the staff member</span>
            <b>Email: {credentials.email}</b>
            <b>Password: {credentials.password}</b>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-t">Transport Staff</div>
        {staff.length ? (
          <div className="staff-list">
            {staff.map((person) => (
              <div className="staff-row" key={person.id}>
                <div>
                  <b>{person.name}</b>
                  <span>{person.email}</span>
                </div>
                <span>Created {formatDate(person.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <Empty title="No transport staff yet" sub="Create a staff login before approving buyer requests that need pickup." />
        )}
      </div>
    </div>
  );
}

function compressImage(file) {
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
      image.onerror = () => reject(new Error("Could not prepare image preview"));
      image.onload = () => {
        const maxSide = 1100;
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
        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.78);

        if (imageDataUrl.length > MAX_ENCODED_IMAGE_LENGTH) {
          reject(new Error("Image is still too large after compression"));
          return;
        }
        resolve(imageDataUrl);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function IncomingRequest({ request, api, refresh, toast }) {
  const [busy, setBusy] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [reason, setReason] = useState("");
  const listing = request.listing;
  const recycler = request.recyclerCompany;
  const requester = request.createdBy;

  async function decide(approve) {
    const cleanReason = reason.trim();
    if (!cleanReason) {
      toast("Please enter a decision reason");
      return;
    }

    setBusy(true);
    try {
      await api.post(`/requests/${request.id}/review`, { approve, reason: cleanReason });
      toast(approve ? "Request approved with reason and transport job created" : "Request rejected with reason");
      await refresh();
    } catch (err) {
      toast(err.message || "Could not review request");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-t">Request for: {listing?.title || "Material"}</div>
        <Badge map={REQ_STATUS} status={request.status} />
      </div>
      <div className="card-meta roomy">
        <span><b>Recycler:</b> {recycler?.name || "Recycler"}</span>
        <span><b>Quantity:</b> {listing ? formatQuantity(listing) : "Unknown"}</span>
        <span><b>Price:</b> {listing ? formatPrice(listing) : "Unknown"}</span>
        <span><b>Location:</b> {listing?.location || "Unknown"}</span>
      </div>
      <div className="request-details">
        <div className="profile-title">Recycler Request Details</div>
        <div className="detail-grid">
          <Detail label="Requested quantity" value={requestQuantity(request, listing)} />
          <Detail label="Proposed price" value={requestPrice(request, listing)} />
          <Detail label="Contact name" value={request.contactName || requester?.name} />
          <Detail label="Contact phone" value={request.contactPhone || recycler?.phone} />
          <Detail label="Preferred pickup" value={formatDate(request.preferredPickupDate)} />
          <Detail label="Delivery location" value={request.deliveryLocation} />
          <Detail label="Message" value={request.message || "No message provided"} wide />
        </div>
      </div>
      <button className="btn ghost sm profile-open" onClick={() => setProfileOpen(true)}>
        View full recycler profile
      </button>

      {profileOpen && (
        <RecyclerProfileModal
          request={request}
          listing={listing}
          recycler={recycler}
          requester={requester}
          onClose={() => setProfileOpen(false)}
        />
      )}

      <div className="reason-box">
        <label className="stat-l" htmlFor={`decision-reason-${request.id}`}>Decision reason</label>
        <textarea
          id={`decision-reason-${request.id}`}
          className="input"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows="3"
          placeholder="Explain why this recycler request is approved or rejected"
        />
      </div>
      <div className="row-actions">
        <button className="btn green sm" disabled={busy || !reason.trim()} onClick={() => decide(true)}>Approve Request</button>
        <button className="btn red sm" disabled={busy || !reason.trim()} onClick={() => decide(false)}>Reject</button>
      </div>
    </div>
  );
}

function RecyclerProfileModal({ request, listing, recycler, requester, onClose }) {
  const profile = request.recyclerProfile || {};
  const company = profile.company || recycler || {};
  const contactUser = profile.contactUser || requester || {};
  const stats = profile.stats || {};
  const trustSignals = profile.trustSignals?.length ? profile.trustSignals : ["No trust history recorded yet"];
  const latestCertificate = profile.latestCertificate;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Recycler profile">
      <div className="profile-modal">
        <div className="modal-head">
          <div>
            <div className="modal-kicker">Recycler Profile</div>
            <h2>{company.name || recycler?.name || "Recycler company"}</h2>
            <p>Review the recycler profile, trust history, contact details, and requested material before deciding.</p>
          </div>
          <button className="btn ghost sm" onClick={onClose}>Close</button>
        </div>

        <div className="trust-strip">
          <TrustStat label="Platform status" value={company.status || recycler?.status || "Unknown"} />
          <TrustStat label="Approved requests" value={formatNumber(stats.approvedRequests)} />
          <TrustStat label="Certificates" value={formatNumber(stats.certificatesIssued)} />
          <TrustStat label="Recovered kg" value={formatNumber(stats.recoveredKg)} />
        </div>

        <div className="profile-layout">
          <section className="profile-panel">
            <div className="profile-title">Company and Contact</div>
            <div className="detail-grid">
              <Detail label="Company" value={company.name || recycler?.name} />
              <Detail label="Business type" value={company.type || recycler?.type} />
              <Detail label="Approval status" value={company.status || recycler?.status} />
              <Detail label="Member since" value={formatDate(company.createdAt || recycler?.createdAt)} />
              <Detail label="Company email" value={company.contactEmail || recycler?.contactEmail} />
              <Detail label="Company phone" value={company.phone || recycler?.phone} />
              <Detail label="Contact person" value={contactUser.name || requester?.name} />
              <Detail label="Contact email" value={contactUser.email || requester?.email} />
            </div>
          </section>

          <section className="profile-panel">
            <div className="profile-title">Trust History</div>
            <div className="detail-grid">
              <Detail label="Total requests" value={formatNumber(stats.totalRequests)} />
              <Detail label="Pending requests" value={formatNumber(stats.pendingRequests)} />
              <Detail label="Rejected requests" value={formatNumber(stats.rejectedRequests)} />
              <Detail label="Latest certificate" value={latestCertificate ? latestCertificate.id : "None yet"} />
            </div>
            <div className="trust-list">
              {trustSignals.map((signal) => <span key={signal}>{signal}</span>)}
            </div>
          </section>

          <section className="profile-panel wide-panel">
            <div className="profile-title">Requested Material</div>
            {listing && <MaterialGallery listing={listing} compact />}
            <div className="detail-grid material-detail-grid">
              <Detail label="Material" value={listing?.title} />
              <Detail label="Category" value={categoryName(listing)} />
              <Detail label="Quantity" value={listing ? formatQuantity(listing) : null} />
              <Detail label="Price" value={listing ? formatPrice(listing) : null} />
              <Detail label="Quality" value={listing?.quality || "Pending"} />
              <Detail label="Pickup location" value={listing?.location} />
              <Detail label="Current status" value={LISTING_STATUS[listing?.status]?.t || listing?.status} />
              <Detail label="Requested on" value={formatDate(request.createdAt)} />
              <Detail label="Requested quantity" value={requestQuantity(request, listing)} />
              <Detail label="Proposed price" value={requestPrice(request, listing)} />
              <Detail label="Request contact" value={request.contactName || contactUser.name || requester?.name} />
              <Detail label="Request phone" value={request.contactPhone || company.phone || recycler?.phone} />
              <Detail label="Preferred pickup" value={formatDate(request.preferredPickupDate)} />
              <Detail label="Delivery location" value={request.deliveryLocation} />
              <Detail label="Request note" value={request.message || "No note provided"} wide />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function TrustStat({ label, value }) {
  return (
    <div className="trust-stat">
      <span>{label}</span>
      <b>{value ?? "0"}</b>
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

function requestQuantity(request, listing) {
  if (!request?.requestedQuantity) return listing ? formatQuantity(listing) : "Not provided";
  return `${formatNumber(request.requestedQuantity)} ${String(request.requestedUnit || listing?.unit || "KG").toLowerCase()}`;
}

function requestPrice(request, listing) {
  if (!request?.proposedPrice) return "Not provided";
  return `${String(listing?.currency || "RWF").toUpperCase()} ${formatNumber(request.proposedPrice)}`;
}
