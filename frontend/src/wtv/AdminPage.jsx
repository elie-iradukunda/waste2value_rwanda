import { useState } from "react";
import { Badge, Empty, MaterialGallery, Tabs } from "./ui.jsx";
import { LISTING_STATUS, categoryName, formatDate, formatNumber, formatPrice, formatQuantity } from "./data.js";

export default function AdminPage({ data, api, refresh, toast }) {
  const [tab, setTab] = useState("reports");
  const [newCat, setNewCat] = useState("");
  const [busy, setBusy] = useState("");
  const [statusBusy, setStatusBusy] = useState("");
  const [statusView, setStatusView] = useState(null);

  const reports = data.reports || {};
  const pendingCompanies = data.pendingCompanies || [];
  const pendingListings = data.pendingListings || [];
  const categories = data.categories || [];

  async function run(key, action, message) {
    setBusy(key);
    try {
      await action();
      toast(message);
      await refresh();
      return true;
    } catch (err) {
      toast(err.message || "Action failed");
      return false;
    } finally {
      setBusy("");
    }
  }

  async function openStatusMaterials(row) {
    setStatusBusy(row.status);
    try {
      const listings = await api.get(`/admin/listings/status/${encodeURIComponent(row.status)}`);
      const statusMeta = LISTING_STATUS[row.status] || { t: row.status };
      setStatusView({ status: row.status, label: statusMeta.t, count: Number(row.count || 0), listings });
    } catch (err) {
      toast(err.message || "Could not load materials for this status");
    } finally {
      setStatusBusy("");
    }
  }

  function reviewCompany(company, approve) {
    return run(
      `company-${company.id}`,
      () => api.post(`/admin/companies/${company.id}/review`, { approve }),
      approve ? "Company approved" : "Company rejected"
    );
  }

  function reviewListing(listing, approve, quality) {
    return run(
      `listing-${listing.id}`,
      () => api.post(`/admin/listings/${listing.id}/review`, { approve, quality }),
      approve ? `Material approved with quality ${quality}` : "Material rejected"
    );
  }

  function addCategory() {
    const name = newCat.trim();
    if (!name) return;
    run("category-new", () => api.post("/admin/categories", { name }), "Category added");
    setNewCat("");
  }

  function renameCategory(category, name) {
    const cleanName = name.trim();
    if (!cleanName || cleanName === category.name) return Promise.resolve(false);
    return run(`category-${category.id}`, () => api.patch(`/admin/categories/${category.id}`, { name: cleanName }), "Category updated");
  }

  function deleteCategory(category) {
    return run(`category-${category.id}`, () => api.delete(`/admin/categories/${category.id}`), "Category removed");
  }

  const tabs = [
    { k: "reports", label: "Reports" },
    { k: "companies", label: "Approve Companies", count: pendingCompanies.length || null },
    { k: "waste", label: "Approve Materials", count: pendingListings.length || null },
    { k: "cats", label: "Categories", count: categories.length || null }
  ];

  return (
    <div className="page">
      <div className="page-h">Admin Dashboard</div>
      <div className="page-sub">Review companies, verify listed materials, maintain categories, and monitor platform impact.</div>
      <Tabs tabs={tabs} active={tab} set={setTab} />

      {tab === "reports" && (
        <>
          <div className="stats">
            <div className="stat"><div className="stat-l">Waste Diverted</div><div className="stat-v">{formatNumber(reports.wasteDivertedKg)}<span className="u">kg</span></div></div>
            <div className="stat"><div className="stat-l">Certificates</div><div className="stat-v">{formatNumber(reports.certificatesIssued)}</div></div>
            <div className="stat"><div className="stat-l">Active Listings</div><div className="stat-v">{formatNumber(reports.activeListings)}</div></div>
            <div className="stat"><div className="stat-l">Total Companies</div><div className="stat-v">{formatNumber(reports.totalCompanies)}</div></div>
          </div>

          <div className="grid g2">
            <div className="card">
              <div className="card-t">Recent Activity</div>
              <div className="activity-list">
                {(reports.recentTransactions || []).map((entry) => (
                  <div className="activity-row" key={entry.id}>
                    <span>{formatDate(entry.createdAt)}</span>
                    <b>{entry.message}</b>
                  </div>
                ))}
                {!(reports.recentTransactions || []).length && <Empty title="No recent activity" sub="Workflow activity will appear after users take action." />}
              </div>
            </div>

            <div className="card">
              <div className="card-t">Materials by Status</div>
              <div className="status-bars">
                {(reports.listingsByStatus || []).map((row) => {
                  const status = LISTING_STATUS[row.status] || { t: row.status };
                  const total = (reports.listingsByStatus || []).reduce((sum, item) => sum + Number(item.count || 0), 0);
                  const pct = total ? Math.max(6, Math.round((Number(row.count || 0) / total) * 100)) : 0;
                  return (
                    <button
                      type="button"
                      className="status-row"
                      key={row.status}
                      disabled={Boolean(statusBusy)}
                      onClick={() => openStatusMaterials(row)}
                    >
                      <div className="bar-label"><span>{status.t}</span><b>{row.count}</b></div>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                    </button>
                  );
                })}
                {!(reports.listingsByStatus || []).length && <Empty title="No listings yet" sub="Material status reporting starts after listings are created." />}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "companies" && (
        pendingCompanies.length ? (
          <div className="grid g2">
            {pendingCompanies.map((company) => (
              <CompanyReview key={company.id} company={company} busy={Boolean(busy)} review={reviewCompany} />
            ))}
          </div>
        ) : (
          <Empty title="No companies pending" sub="All registration requests have been processed." />
        )
      )}

      {tab === "waste" && (
        pendingListings.length ? (
          <div className="grid g2">
            {pendingListings.map((listing) => (
              <WasteReview key={listing.id} listing={listing} busy={Boolean(busy)} review={reviewListing} />
            ))}
          </div>
        ) : (
          <Empty title="No materials pending approval" sub="All submitted materials have been reviewed." />
        )
      )}

      {tab === "cats" && (
        <CategoryManagement
          categories={categories}
          newCat={newCat}
          setNewCat={setNewCat}
          busy={Boolean(busy)}
          addCategory={addCategory}
          renameCategory={renameCategory}
          deleteCategory={deleteCategory}
        />
      )}

      {statusView && (
        <StatusMaterialsModal
          view={statusView}
          busy={Boolean(busy)}
          onClose={() => setStatusView(null)}
          onReview={reviewListing}
        />
      )}
    </div>
  );
}

function CompanyReview({ company, busy, review }) {
  const [open, setOpen] = useState(false);
  const primaryUser = company.users?.[0];

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-t">{company.name}</div>
        <span className="badge b-amber"><span className="dot" />Pending review</span>
      </div>
      <div className="card-meta roomy">
        <span><b>Type:</b> {company.type}</span>
        <span><b>Contact:</b> {company.contactEmail || primaryUser?.email || "Not provided"}</span>
        <span><b>Phone:</b> {company.phone || "Not provided"}</span>
        {company.businessLocation && <span><b>Location:</b> {company.businessLocation}</span>}
        {company.producedMaterials && <span><b>Produces:</b> {company.producedMaterials}</span>}
        <span><b>Registered:</b> {formatDate(company.createdAt)}</span>
      </div>
      <div className="row-actions">
        <button className="btn sm" disabled={busy} onClick={() => setOpen(true)}>View full details</button>
      </div>

      {open && (
        <CompanyDetailsModal
          company={company}
          busy={busy}
          onClose={() => setOpen(false)}
          onReview={async (approve) => {
            await review(company, approve);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function CompanyDetailsModal({ company, busy, onClose, onReview }) {
  const users = company.users || [];
  const primaryUser = users[0] || {};
  const roleText = companyTypeText(company.type);
  const isProducer = String(company.type || "").toUpperCase() === "PRODUCER";

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Company approval details">
      <div className="profile-modal company-modal">
        <div className="modal-head">
          <div>
            <div className="modal-kicker">Company Approval Review</div>
            <h2>{company.name}</h2>
            <p>Review the company profile and linked account before approving access to the Waste to Value workflow.</p>
          </div>
          <button className="btn ghost sm" disabled={busy} onClick={onClose}>Close</button>
        </div>

        <div className="trust-strip">
          <div className="trust-stat"><span>Company type</span><b>{roleText}</b></div>
          <div className="trust-stat"><span>Status</span><b>{company.status || "Pending"}</b></div>
          <div className="trust-stat"><span>Linked users</span><b>{users.length || 0}</b></div>
          <div className="trust-stat"><span>Submitted</span><b>{formatDate(company.createdAt)}</b></div>
        </div>

        <div className="profile-layout">
          <section className="profile-panel">
            <div className="profile-title">Company Details</div>
            <div className="detail-grid">
              <Detail label="Company name" value={company.name} />
              <Detail label="Business type" value={roleText} />
              <Detail label="Contact email" value={company.contactEmail || primaryUser.email} />
              <Detail label="Phone" value={company.phone} />
              <Detail label="Business location" value={company.businessLocation} />
              <Detail label="RDB number" value={company.registrationNumber} />
              <Detail label="Company ID" value={company.id} />
              <Detail label="Last updated" value={formatDate(company.updatedAt)} />
            </div>
          </section>

          <section className="profile-panel">
            <div className="profile-title">Primary Account</div>
            <div className="detail-grid">
              <Detail label="Name" value={primaryUser.name} />
              <Detail label="Email" value={primaryUser.email} />
              <Detail label="Role" value={primaryUser.role} />
              <Detail label="Created" value={formatDate(primaryUser.createdAt)} />
            </div>
          </section>

          {isProducer && (
            <section className="profile-panel wide-panel">
              <div className="profile-title">Producer Approval Profile</div>
              <div className="detail-grid">
                <Detail label="What they produce" value={company.producedMaterials} wide />
                <Detail label="Production profile" value={company.productionDescription} wide />
                <Detail label="RDB document" value={company.rdbDocumentName} />
                <Detail label="Document status" value={company.rdbDocumentDataUrl ? "Uploaded for admin review" : "Missing"} />
              </div>
              {company.rdbDocumentDataUrl && (
                <div className="row-actions">
                  <a className="btn ghost sm" href={company.rdbDocumentDataUrl} target="_blank" rel="noreferrer">
                    Open RDB document
                  </a>
                </div>
              )}
            </section>
          )}

          <section className="profile-panel wide-panel">
            <div className="profile-title">Approval Meaning</div>
            <div className="detail-grid">
              <Detail label="Access after approval" value={approvalMeaning(company.type)} wide />
              <Detail label="Decision check" value={isProducer ? "Confirm RDB document, production activity, business location, and contact details before approving this producer." : "Confirm the account contact, business category, and phone/email look correct before approving."} wide />
            </div>
          </section>

          {users.length > 1 && (
            <section className="profile-panel wide-panel">
              <div className="profile-title">Linked Users</div>
              <div className="detail-grid">
                {users.map((user) => (
                  <Detail key={user.id} label={user.role || "User"} value={`${user.name || "Unnamed"} - ${user.email || "No email"}`} />
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="row-actions modal-actions">
          <button className="btn green sm" disabled={busy} onClick={() => onReview(true)}>Approve company</button>
          <button className="btn red sm" disabled={busy} onClick={() => onReview(false)}>Reject company</button>
          <button className="btn ghost sm" disabled={busy} onClick={onClose}>Back</button>
        </div>
      </div>
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

function companyTypeText(type) {
  const value = String(type || "").toUpperCase();
  if (value === "PRODUCER") return "Waste Producer";
  if (value === "RECYCLER") return "Recycler / SME";
  if (value === "TRANSPORT") return "Transport Staff";
  return type || "Company";
}

function approvalMeaning(type) {
  const value = String(type || "").toUpperCase();
  if (value === "PRODUCER") return "This company can post waste materials for admin approval and review buyer requests.";
  if (value === "RECYCLER") return "This company can view approved materials, request supply, confirm receipt, and receive certificates.";
  if (value === "TRANSPORT") return "Transport staff accounts are created by approved producers and record pickup/delivery proof.";
  return "This company will receive platform access after approval.";
}

function StatusMaterialsModal({ view, busy, onClose, onReview }) {
  const [selected, setSelected] = useState(null);
  const listings = view.listings || [];

  async function reviewFromDetails(listing, approve, quality) {
    const reviewed = await onReview(listing, approve, quality);
    if (reviewed) {
      setSelected(null);
      onClose();
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`${view.label} materials`}>
      <div className="profile-modal status-materials-modal">
        <div className="modal-head">
          <div>
            <div className="modal-kicker">Materials by Status</div>
            <h2>{view.label}</h2>
            <p>Click any material to inspect photos, pricing, producer details, requests, transport movement, and certificate information.</p>
          </div>
          <button className="btn ghost sm" disabled={busy} onClick={onClose}>Close</button>
        </div>

        <div className="request-summary">
          <Detail label="Status" value={view.label} />
          <Detail label="Materials" value={String(listings.length || view.count || 0)} />
          <Detail label="Marketplace access" value={view.status === "APPROVED" ? "Visible to buyers" : accessTextForStatus(view.status)} />
          <Detail label="Report source" value="Live admin listing data" />
        </div>

        {listings.length ? (
          <div className="grid g2 status-material-list">
            {listings.map((listing) => (
              <StatusMaterialCard key={listing.id} listing={listing} onOpen={() => setSelected(listing)} />
            ))}
          </div>
        ) : (
          <Empty title="No materials in this status" sub="The report count may refresh after the next dashboard load." />
        )}

        <div className="row-actions modal-actions">
          <button className="btn ghost sm" disabled={busy} onClick={onClose}>Back to reports</button>
        </div>
      </div>

      {selected && (
        <MaterialReviewModal
          listing={selected}
          busy={busy}
          readOnly={String(selected.status).toUpperCase() !== "PENDING_APPROVAL"}
          onClose={() => setSelected(null)}
          onReview={(approve, quality) => reviewFromDetails(selected, approve, quality)}
        />
      )}
    </div>
  );
}

function StatusMaterialCard({ listing, onOpen }) {
  const requests = listing.requests || [];
  const approvedRequest = requests.find((request) => String(request.status).toUpperCase() === "APPROVED");

  return (
    <div className="card status-material-card">
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
        <span><b>Producer:</b> {listing.producerCompany?.name || "Unknown"}</span>
        {listing.quality && <span><b>Quality:</b> {listing.quality}</span>}
        {requests.length > 0 && <span><b>Requests:</b> {requests.length}</span>}
        {approvedRequest && <span><b>Buyer:</b> {approvedRequest.recyclerCompany?.name || approvedRequest.contactName || "Approved buyer"}</span>}
        {listing.job && <span><b>Transport:</b> {JOB_STATUS_TEXT(listing.job.status)}</span>}
        {listing.certificate && <span><b>Certificate:</b> {listing.certificate.id}</span>}
      </div>
      {listing.description && <p className="card-copy">{listing.description}</p>}
      <div className="row-actions">
        <button className="btn sm" onClick={onOpen}>View full details</button>
      </div>
    </div>
  );
}

function WasteReview({ listing, busy, review }) {
  const [open, setOpen] = useState(false);

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
        <span><b>Producer:</b> {listing.producerCompany?.name || "Unknown"}</span>
      </div>
      {listing.description && <p className="card-copy">{listing.description}</p>}
      <div className="row-actions">
        <button className="btn sm" disabled={busy} onClick={() => setOpen(true)}>View full details</button>
      </div>

      {open && (
        <MaterialReviewModal
          listing={listing}
          busy={busy}
          onClose={() => setOpen(false)}
          onReview={async (approve, quality) => {
            await review(listing, approve, quality);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function MaterialReviewModal({ listing, busy, onClose, onReview, readOnly = false }) {
  const [quality, setQuality] = useState("A");
  const producer = listing.producerCompany || {};
  const requests = listing.requests || [];
  const job = listing.job || null;
  const certificate = listing.certificate || null;
  const isPending = String(listing.status).toUpperCase() === "PENDING_APPROVAL";

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Material approval details">
      <div className="profile-modal material-review-modal">
        <div className="modal-head">
          <div>
            <div className="modal-kicker">{readOnly ? "Material Details" : "Material Approval Review"}</div>
            <h2>{listing.title}</h2>
            <p>{readOnly ? "Review the full material record, producer, requests, transport movement, and certificate status." : "This material is locked from marketplace use until an admin approves it and assigns a quality grade."}</p>
          </div>
          <button className="btn ghost sm" disabled={busy} onClick={onClose}>Close</button>
        </div>

        <div className="material-modal-photo">
          <MaterialGallery listing={listing} />
        </div>

        <div className="trust-strip">
          <div className="trust-stat"><span>Status</span><b>{LISTING_STATUS[listing.status]?.t || listing.status}</b></div>
          <div className="trust-stat"><span>Category</span><b>{categoryName(listing)}</b></div>
          <div className="trust-stat"><span>Quantity</span><b>{formatQuantity(listing)}</b></div>
          <div className="trust-stat"><span>Price</span><b>{formatPrice(listing)}</b></div>
        </div>

        <div className="profile-layout">
          <section className="profile-panel">
            <div className="profile-title">Material Details</div>
            <div className="detail-grid">
              <Detail label="Material name" value={listing.title} />
              <Detail label="Category" value={categoryName(listing)} />
              <Detail label="Quantity" value={formatQuantity(listing)} />
              <Detail label="Price" value={formatPrice(listing)} />
              <Detail label="Location" value={listing.location} />
              <Detail label="Status" value={LISTING_STATUS[listing.status]?.t || listing.status} />
              <Detail label="Quality grade" value={listing.quality ? `Grade ${listing.quality}` : "Not assigned"} />
              <Detail label="Submitted" value={formatDate(listing.createdAt)} />
              <Detail label="Description" value={listing.description} wide />
            </div>
          </section>

          <section className="profile-panel">
            <div className="profile-title">Producer Profile</div>
            <div className="detail-grid">
              <Detail label="Company" value={producer.name} />
              <Detail label="Type" value={companyTypeText(producer.type)} />
              <Detail label="Status" value={producer.status} />
              <Detail label="Email" value={producer.contactEmail} />
              <Detail label="Phone" value={producer.phone} />
              <Detail label="Member since" value={formatDate(producer.createdAt)} />
            </div>
          </section>

          {(requests.length > 0 || job || certificate) && (
            <section className="profile-panel wide-panel">
              <div className="profile-title">Workflow Details</div>
              <div className="detail-grid">
                <Detail label="Requests" value={requests.length ? `${requests.length} request${requests.length === 1 ? "" : "s"}` : "No requests"} />
                <Detail label="Approved buyer" value={approvedBuyerName(requests)} />
                <Detail label="Transport status" value={job ? JOB_STATUS_TEXT(job.status) : "No transport job"} />
                <Detail label="Certificate" value={certificate?.id || "No certificate"} />
                {job && <Detail label="Pickup" value={job.pickupLocation} />}
                {job && <Detail label="Dropoff" value={job.deliveryLocation || job.dropoffLocation} />}
                {certificate && <Detail label="Certified quantity" value={formatQuantity(certificate)} />}
                {certificate && <Detail label="Receipt location" value={certificate.receiptLocation} />}
              </div>
            </section>
          )}

          <section className="profile-panel wide-panel">
            <div className="profile-title">{readOnly ? "Access Status" : "Approval Decision"}</div>
            <div className="detail-grid">
              <Detail label="Access rule" value={accessTextForStatus(listing.status)} wide />
              <Detail label={readOnly ? "Current state" : "Quality check"} value={readOnly ? `This material is currently ${LISTING_STATUS[listing.status]?.t || listing.status}.` : "Choose grade A, B, or C after reviewing photos, description, quantity, category, and producer details."} wide />
            </div>
            {!readOnly && isPending && (
              <div className="quality-pick">
                <small className="hint">Quality grade:</small>
                {["A", "B", "C"].map((grade) => (
                  <button key={grade} className={`qbtn ${quality === grade ? "on" : ""}`} onClick={() => setQuality(grade)}>{grade}</button>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="row-actions modal-actions">
          {!readOnly && isPending && (
            <>
              <button className="btn green sm" disabled={busy} onClick={() => onReview(true, quality)}>Approve material for use</button>
              <button className="btn red sm" disabled={busy} onClick={() => onReview(false, null)}>Reject material</button>
            </>
          )}
          <button className="btn ghost sm" disabled={busy} onClick={onClose}>Back</button>
        </div>
      </div>
    </div>
  );
}

function accessTextForStatus(status) {
  const value = String(status || "").toUpperCase();
  if (value === "PENDING_APPROVAL") return "Locked until admin approval.";
  if (value === "APPROVED") return "Visible in marketplace and available for recycler requests.";
  if (value === "MATCHED") return "Approved and matched with a buyer.";
  if (value === "IN_TRANSIT") return "Approved, matched, and currently moving through transport.";
  if (value === "DELIVERED") return "Delivered to buyer and waiting for recycler receipt confirmation.";
  if (value === "CERTIFIED") return "Completed and certified by the system.";
  if (value === "REJECTED") return "Rejected and hidden from marketplace use.";
  return "Status not recognized.";
}

function approvedBuyerName(requests = []) {
  const request = requests.find((item) => String(item.status).toUpperCase() === "APPROVED");
  return request?.recyclerCompany?.name || request?.contactName || "No approved buyer";
}

function JOB_STATUS_TEXT(status) {
  const value = String(status || "").toUpperCase();
  if (value === "WAITING") return "Waiting for pickup";
  if (value === "PICKED_UP") return "Picked up";
  if (value === "IN_TRANSIT") return "In transit";
  if (value === "DELIVERED") return "Delivered";
  return status || "No transport job";
}

function CategoryManagement({ categories, newCat, setNewCat, busy, addCategory, renameCategory, deleteCategory }) {
  const totalMaterials = categories.reduce((sum, category) => sum + Number(category.totalListings || 0), 0);
  const usedCategories = categories.filter((category) => Number(category.totalListings || 0) > 0).length;
  const unusedCategories = categories.length - usedCategories;

  return (
    <div className="category-management">
      <div className="category-summary">
        <Detail label="Total categories" value={String(categories.length)} />
        <Detail label="Used categories" value={String(usedCategories)} />
        <Detail label="Unused categories" value={String(unusedCategories)} />
        <Detail label="Materials assigned" value={formatNumber(totalMaterials)} />
      </div>

      <div className="card category-card">
        <div className="card-head">
          <div>
            <div className="card-t">Waste Categories</div>
            <p className="card-copy">Rename categories, inspect usage, and remove only categories that are not used by any material.</p>
          </div>
        </div>

        <div className="category-list">
          {categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              busy={busy}
              renameCategory={renameCategory}
              deleteCategory={deleteCategory}
            />
          ))}
          {!categories.length && <Empty title="No categories yet" sub="Add the first category below." />}
        </div>

        <div className="add-cat">
          <input
            className="input"
            placeholder="New category"
            value={newCat}
            onChange={(event) => setNewCat(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && addCategory()}
          />
          <button className="btn sm" disabled={busy || !newCat.trim()} onClick={addCategory}>Add category</button>
        </div>
      </div>
    </div>
  );
}

function CategoryRow({ category, busy, renameCategory, deleteCategory }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const total = Number(category.totalListings || 0);

  async function save() {
    const updated = await renameCategory(category, name);
    if (updated) setEditing(false);
  }

  return (
    <div className="cat-row category-row">
      <div className="category-row-main">
        {editing ? (
          <input className="input category-name-input" value={name} onChange={(event) => setName(event.target.value)} />
        ) : (
          <>
            <span>{category.name}</span>
            <small>
              {total} material{total === 1 ? "" : "s"} assigned
              {category.activeListings ? ` - ${category.activeListings} active` : ""}
              {category.certifiedListings ? ` - ${category.certifiedListings} certified` : ""}
            </small>
          </>
        )}
      </div>

      <div className="category-actions">
        {editing ? (
          <>
            <button className="btn green sm" disabled={busy || !name.trim()} onClick={save}>Save</button>
            <button className="btn ghost sm" disabled={busy} onClick={() => { setName(category.name); setEditing(false); }}>Cancel</button>
          </>
        ) : (
          <>
            <button className="btn ghost sm" disabled={busy} onClick={() => setOpen(true)}>View details</button>
            <button className="btn ghost sm" disabled={busy} onClick={() => setEditing(true)}>Rename</button>
            <button
              className="btn red sm"
              disabled={busy || !category.canDelete}
              title={category.canDelete ? "Remove unused category" : "This category has assigned materials"}
              onClick={() => deleteCategory(category)}
            >
              {category.canDelete ? "Remove" : "In use"}
            </button>
          </>
        )}
      </div>

      {open && <CategoryDetailsModal category={category} busy={busy} onClose={() => setOpen(false)} />}
    </div>
  );
}

function CategoryDetailsModal({ category, busy, onClose }) {
  const [selected, setSelected] = useState(null);
  const statusCounts = category.statusCounts || {};
  const recentListings = category.recentListings || [];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Category details">
      <div className="profile-modal category-details-modal">
        <div className="modal-head">
          <div>
            <div className="modal-kicker">Category Details</div>
            <h2>{category.name}</h2>
            <p>Review how this category is used before renaming or removing it.</p>
          </div>
          <button className="btn ghost sm" disabled={busy} onClick={onClose}>Close</button>
        </div>

        <div className="trust-strip">
          <div className="trust-stat"><span>Total materials</span><b>{formatNumber(category.totalListings || 0)}</b></div>
          <div className="trust-stat"><span>Active</span><b>{formatNumber(category.activeListings || 0)}</b></div>
          <div className="trust-stat"><span>Certified</span><b>{formatNumber(category.certifiedListings || 0)}</b></div>
          <div className="trust-stat"><span>Delete status</span><b>{category.canDelete ? "Safe" : "In use"}</b></div>
        </div>

        <div className="profile-layout">
          <section className="profile-panel">
            <div className="profile-title">Status Breakdown</div>
            <div className="detail-grid">
              {Object.entries(LISTING_STATUS).map(([status, meta]) => (
                <Detail key={status} label={meta.t} value={formatNumber(statusCounts[status] || 0)} />
              ))}
            </div>
          </section>

          <section className="profile-panel">
            <div className="profile-title">Management Rule</div>
            <div className="detail-grid">
              <Detail label="Can remove" value={category.canDelete ? "Yes" : "No"} />
              <Detail label="Reason" value={category.canDelete ? "No materials use this category." : "Move or reclassify assigned materials before removing this category."} wide />
            </div>
          </section>

          <section className="profile-panel wide-panel">
            <div className="profile-title">Recent Materials</div>
            {recentListings.length ? (
              <div className="grid g2 category-material-grid">
                {recentListings.map((listing) => (
                  <StatusMaterialCard key={listing.id} listing={listing} onOpen={() => setSelected(listing)} />
                ))}
              </div>
            ) : (
              <Empty title="No materials assigned" sub="This category can be safely removed if no longer needed." />
            )}
          </section>
        </div>

        <div className="row-actions modal-actions">
          <button className="btn ghost sm" disabled={busy} onClick={onClose}>Back to categories</button>
        </div>
      </div>

      {selected && (
        <MaterialReviewModal
          listing={selected}
          busy={busy}
          readOnly
          onClose={() => setSelected(null)}
          onReview={() => Promise.resolve(false)}
        />
      )}
    </div>
  );
}
