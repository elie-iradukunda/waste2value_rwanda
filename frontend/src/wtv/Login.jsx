import { useEffect, useState } from "react";
import { apiRequest } from "./api.js";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, LISTING_STATUS, categoryName, formatDate, formatPrice, formatQuantity } from "./data.js";
import { MaterialGallery, MaterialPhoto } from "./ui.jsx";

const REGISTER_ROLE_OPTIONS = [
  { value: "PRODUCER", label: "Waste Producer", text: "Register your company for admin approval before listing materials." },
  { value: "RECYCLER", label: "Recycler / SME", text: "Register and start requesting approved marketplace materials." }
];

const PUBLIC_ROLE_OPTIONS = [
  ...REGISTER_ROLE_OPTIONS,
  { value: "TRANSPORT_STAFF", label: "Transport Staff", text: "Producer-created staff accounts receive assigned pickup and delivery jobs." }
];

const MAX_RDB_DOCUMENT_SIZE = 4 * 1024 * 1024;

export default function Login({ onLogin, onRegister, busy }) {
  const [mode, setMode] = useState("");
  const [materials, setMaterials] = useState([]);
  const [producers, setProducers] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedProducer, setSelectedProducer] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      apiRequest("/public/marketplace").catch(() => []),
      apiRequest("/public/producers").catch(() => [])
    ]).then(([marketplace, producerRows]) => {
      if (!alive) return;
      setMaterials(Array.isArray(marketplace) ? marketplace : []);
      setProducers(Array.isArray(producerRows) ? producerRows : []);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="public-page">
      <header className="public-nav">
        <div className="brand">
          <div className="logo small">W2V</div>
          <div>
            <div className="brand-name">Waste to Value</div>
            <div className="brand-sub">Rwanda circular exchange</div>
          </div>
        </div>
        <div className="public-nav-actions">
          <button className="btn ghost sm" onClick={() => setMode("login")}>Log in</button>
          <button className="btn sm" onClick={() => setMode("register")}>Register company</button>
        </div>
      </header>

      <section className="public-hero">
        <div className="public-hero-overlay" />
        <div className="public-hero-content">
          <div className="public-kicker">Trusted material exchange</div>
          <h1>Turn industrial waste into usable business value.</h1>
          <p>
            Waste to Value connects producers, recyclers, SMEs, and producer transport staff so materials can be listed,
            approved, requested, moved, and certified in one simple workflow.
          </p>
          <div className="public-actions">
            <button className="btn green" onClick={() => setMode("register")}>Start with your company</button>
            <button className="btn ghost" onClick={() => setMode("login")}>I already have an account</button>
          </div>
        </div>
      </section>

      <main className="public-main">
        <section className="public-band">
          <div>
            <span className="public-stat">01</span>
            <b>Post or find materials</b>
            <p>Companies list plastic, metal, paper, glass, organic waste, and electronics with photos and prices.</p>
          </div>
          <div>
            <span className="public-stat">02</span>
            <b>Approve before use</b>
            <p>Admins review companies and materials before they become trusted marketplace records.</p>
          </div>
          <div>
            <span className="public-stat">03</span>
            <b>Track and certify</b>
            <p>Transport proof, receipt approval, and certificates keep the material movement clear.</p>
          </div>
        </section>

        <section className="public-roles">
          {PUBLIC_ROLE_OPTIONS.map((role) => (
            <article key={role.value} className="public-role-card">
              <span>{role.label}</span>
              <p>{role.text}</p>
            </article>
          ))}
        </section>

        <PublicMarketplaceSection
          materials={materials}
          onOpen={setSelectedMaterial}
          onRegister={() => setMode("register")}
        />

        <PublicProducerSection
          producers={producers}
          onOpen={setSelectedProducer}
          onRegister={() => setMode("register")}
        />
      </main>

      {mode === "login" && <LoginModal busy={busy} onClose={() => setMode("")} onLogin={onLogin} />}
      {mode === "register" && <RegisterModal busy={busy} onClose={() => setMode("")} onRegister={onRegister} />}
      {selectedMaterial && (
        <PublicMaterialModal
          listing={selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
          onRegister={() => {
            setSelectedMaterial(null);
            setMode("register");
          }}
        />
      )}
      {selectedProducer && (
        <PublicProducerModal
          producer={selectedProducer}
          onClose={() => setSelectedProducer(null)}
          onRegister={() => {
            setSelectedProducer(null);
            setMode("register");
          }}
        />
      )}
    </div>
  );
}

function PublicMarketplaceSection({ materials, onOpen, onRegister }) {
  return (
    <section className="public-section">
      <div className="public-section-head">
        <div>
          <div className="public-kicker">Public marketplace</div>
          <h2>Approved materials ready for use</h2>
          <p>Preview trusted materials that recyclers and SMEs can request after registration and approval.</p>
        </div>
        <button className="btn sm" onClick={onRegister}>Request after registration</button>
      </div>

      {materials.length ? (
        <div className="public-card-grid">
          {materials.slice(0, 6).map((listing) => (
            <article className="public-material-card" key={listing.id}>
              <MaterialPhoto listing={listing} compact />
              <div className="public-card-title">{listing.title}</div>
              <div className="public-card-meta">
                <span>{categoryName(listing)}</span>
                <span>{formatQuantity(listing)}</span>
                <span>{formatPrice(listing)}</span>
              </div>
              <p>{listing.location || "Location not provided"}</p>
              <button className="btn ghost sm" onClick={() => onOpen(listing)}>View full details</button>
            </article>
          ))}
        </div>
      ) : (
        <div className="public-empty">Approved marketplace materials will appear here after admin review.</div>
      )}
    </section>
  );
}

function PublicProducerSection({ producers, onOpen, onRegister }) {
  return (
    <section className="public-section">
      <div className="public-section-head">
        <div>
          <div className="public-kicker">Approved producers</div>
          <h2>Certified producers and what they supply</h2>
          <p>See trusted producers, their material categories, and certificate activity before joining the platform.</p>
        </div>
        <button className="btn ghost sm" onClick={onRegister}>Register to work with them</button>
      </div>

      {producers.length ? (
        <div className="public-producer-grid">
          {producers.slice(0, 6).map((producer) => (
            <article className="public-producer-card" key={producer.id}>
              <div className="public-producer-top">
                <div className="producer-mark">{producer.name?.slice(0, 2).toUpperCase() || "WP"}</div>
                <div>
                  <div className="public-card-title">{producer.name}</div>
                  <p>{producer.certificateCount ? "Certified producer" : "Approved producer"}</p>
                </div>
              </div>
              <div className="public-card-meta">
                <span>{producer.materialCount || 0} materials</span>
                <span>{producer.certificateCount || 0} certificates</span>
              </div>
              <p>{producer.categories?.length ? producer.categories.join(", ") : "Material categories not yet published"}</p>
              <button className="btn ghost sm" onClick={() => onOpen(producer)}>View producer details</button>
            </article>
          ))}
        </div>
      ) : (
        <div className="public-empty">Approved producer profiles will appear here.</div>
      )}
    </section>
  );
}

function PublicMaterialModal({ listing, onClose, onRegister }) {
  const producer = listing.producerCompany || {};

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Public material details">
      <div className="profile-modal public-detail-modal">
        <div className="modal-head">
          <div>
            <div className="modal-kicker">Approved Material</div>
            <h2>{listing.title}</h2>
            <p>This material is approved for marketplace use. Register as a recycler or SME to request supply.</p>
          </div>
          <button className="btn ghost sm" onClick={onClose}>Close</button>
        </div>

        <div className="material-modal-photo">
          <MaterialGallery listing={listing} />
        </div>

        <div className="profile-layout">
          <section className="profile-panel">
            <div className="profile-title">Material Details</div>
            <div className="detail-grid">
              <PublicDetail label="Category" value={categoryName(listing)} />
              <PublicDetail label="Quantity" value={formatQuantity(listing)} />
              <PublicDetail label="Price" value={formatPrice(listing)} />
              <PublicDetail label="Quality" value={listing.quality ? `Grade ${listing.quality}` : "Approved"} />
              <PublicDetail label="Location" value={listing.location} />
              <PublicDetail label="Approved status" value={LISTING_STATUS[listing.status]?.t || listing.status} />
              <PublicDetail label="Description" value={listing.description} wide />
            </div>
          </section>

          <section className="profile-panel">
            <div className="profile-title">Producer</div>
            <div className="detail-grid">
              <PublicDetail label="Company" value={producer.name} />
              <PublicDetail label="Status" value={producer.status} />
              <PublicDetail label="Email" value={producer.contactEmail} />
              <PublicDetail label="Phone" value={producer.phone} />
              <PublicDetail label="Member since" value={formatDate(producer.createdAt)} />
            </div>
          </section>
        </div>

        <div className="row-actions modal-actions">
          <button className="btn green sm" onClick={onRegister}>Register to request this material</button>
          <button className="btn ghost sm" onClick={onClose}>Back</button>
        </div>
      </div>
    </div>
  );
}

function PublicProducerModal({ producer, onClose, onRegister }) {
  const materials = producer.materials || [];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Public producer details">
      <div className="profile-modal public-detail-modal">
        <div className="modal-head">
          <div>
            <div className="modal-kicker">{producer.certificateCount ? "Certified Producer" : "Approved Producer"}</div>
            <h2>{producer.name}</h2>
            <p>Review public producer details and the approved materials they supply through Waste to Value.</p>
          </div>
          <button className="btn ghost sm" onClick={onClose}>Close</button>
        </div>

        <div className="trust-strip">
          <div className="trust-stat"><span>Status</span><b>{producer.status}</b></div>
          <div className="trust-stat"><span>Materials</span><b>{producer.materialCount || 0}</b></div>
          <div className="trust-stat"><span>Certificates</span><b>{producer.certificateCount || 0}</b></div>
          <div className="trust-stat"><span>Categories</span><b>{producer.categories?.length || 0}</b></div>
        </div>

        <div className="profile-layout">
          <section className="profile-panel">
            <div className="profile-title">Company Profile</div>
            <div className="detail-grid">
              <PublicDetail label="Company" value={producer.name} />
              <PublicDetail label="Type" value="Waste Producer" />
              <PublicDetail label="Email" value={producer.contactEmail} />
              <PublicDetail label="Phone" value={producer.phone} />
              <PublicDetail label="Location" value={producer.businessLocation} />
              <PublicDetail label="RDB number" value={producer.registrationNumber} />
              <PublicDetail label="Member since" value={formatDate(producer.createdAt)} />
              <PublicDetail label="Produces" value={producer.producedMaterials || producer.categories?.join(", ")} wide />
              <PublicDetail label="Producer profile" value={producer.productionDescription} wide />
            </div>
          </section>

          <section className="profile-panel wide-panel">
            <div className="profile-title">Approved Materials</div>
            {materials.length ? (
              <div className="public-mini-list">
                {materials.map((listing) => (
                  <div className="public-mini-row" key={listing.id}>
                    <div>
                      <b>{listing.title}</b>
                      <span>{categoryName(listing)} - {formatQuantity(listing)} - {formatPrice(listing)}</span>
                    </div>
                    <span>{LISTING_STATUS[listing.status]?.t || listing.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="public-empty compact">No approved public materials are listed yet.</div>
            )}
          </section>
        </div>

        <div className="row-actions modal-actions">
          <button className="btn green sm" onClick={onRegister}>Register to work with this producer</button>
          <button className="btn ghost sm" onClick={onClose}>Back</button>
        </div>
      </div>
    </div>
  );
}

function PublicDetail({ label, value, wide = false }) {
  return (
    <div className={wide ? "detail-item wide" : "detail-item"}>
      <span>{label}</span>
      <b>{value || "Not provided"}</b>
    </div>
  );
}

function LoginModal({ busy, onClose, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(nextEmail = email, nextPassword = password) {
    setError("");
    const cleanEmail = nextEmail.trim().toLowerCase();

    if (!cleanEmail || !nextPassword) {
      setError("Email and password are required.");
      return;
    }

    try {
      await onLogin({ email: cleanEmail, password: nextPassword });
    } catch (err) {
      setError(err.message || "Login failed.");
    }
  }

  function useDemo(account) {
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
    submit(account.email, DEMO_PASSWORD);
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Log in">
      <div className="login-card auth-modal">
        <div className="modal-head auth-modal-head">
          <div>
            <div className="logo">W2V</div>
            <div className="login-title">Welcome back</div>
            <div className="login-sub">Log in to your Waste to Value dashboard.</div>
          </div>
          <button className="btn ghost sm" onClick={onClose}>Close</button>
        </div>

        <div className="field">
          <label>Email</label>
          <input
            className="input"
            value={email}
            onChange={(event) => { setEmail(event.target.value); setError(""); }}
            onKeyDown={(event) => event.key === "Enter" && submit()}
            placeholder="admin@wastetovalue.rw"
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => { setPassword(event.target.value); setError(""); }}
            onKeyDown={(event) => event.key === "Enter" && submit()}
            placeholder="password123"
            autoComplete="current-password"
          />
        </div>
        {error && <div className="err">{error}</div>}
        <button className="btn block" disabled={busy} onClick={() => submit()}>
          {busy ? "Logging in..." : "Log in"}
        </button>

        <div className="demo">
          <div className="demo-h">Demo accounts use password: {DEMO_PASSWORD}</div>
          {DEMO_ACCOUNTS.map((account) => (
            <button key={account.key} className="chip" disabled={busy} onClick={() => useDemo(account)}>
              <span className="chip-ico" style={{ background: `${account.color}22`, color: account.color }}>{account.initial}</span>
              <span>
                <div className="chip-t">{account.label}</div>
                <div className="chip-e">{account.email}</div>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RegisterModal({ busy, onClose, onRegister }) {
  const [form, setForm] = useState({
    role: "PRODUCER",
    companyName: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    registrationNumber: "",
    businessLocation: "",
    producedMaterials: "",
    productionDescription: "",
    rdbDocumentName: "",
    rdbDocumentDataUrl: ""
  });
  const [documentBusy, setDocumentBusy] = useState(false);
  const [error, setError] = useState("");

  function update(key) {
    return (event) => {
      setForm({ ...form, [key]: event.target.value });
      setError("");
    };
  }

  async function chooseDocument(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setDocumentBusy(true);
    setError("");
    try {
      const document = await readCompanyDocument(file);
      setForm((current) => ({
        ...current,
        rdbDocumentName: document.name,
        rdbDocumentDataUrl: document.dataUrl
      }));
    } catch (err) {
      setError(err.message || "Could not load RDB document.");
    } finally {
      setDocumentBusy(false);
    }
  }

  async function submit() {
    const payload = {
      role: form.role,
      companyName: form.companyName.trim(),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      password: form.password,
      registrationNumber: form.registrationNumber.trim(),
      businessLocation: form.businessLocation.trim(),
      producedMaterials: form.producedMaterials.trim(),
      productionDescription: form.productionDescription.trim(),
      rdbDocumentName: form.rdbDocumentName,
      rdbDocumentDataUrl: form.rdbDocumentDataUrl
    };

    if (!payload.companyName || !payload.name || !payload.email || !payload.password) {
      setError("Company, contact name, email and password are required.");
      return;
    }
    if (payload.password.length < 6) {
      setError("Use at least 6 characters for the password.");
      return;
    }
    if (payload.role === "PRODUCER") {
      if (!payload.businessLocation || !payload.producedMaterials || !payload.productionDescription) {
        setError("Producer approval requires location, what you produce, and a short production profile.");
        return;
      }
      if (!payload.rdbDocumentDataUrl) {
        setError("Upload one RDB registration document before submitting as a producer.");
        return;
      }
    }

    try {
      await onRegister(payload);
    } catch (err) {
      setError(err.message || "Registration failed.");
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Register company">
      <div className="login-card auth-modal register-modal">
        <div className="modal-head auth-modal-head">
          <div>
            <div className="logo">W2V</div>
            <div className="login-title">Register your company</div>
            <div className="login-sub">Producer companies need admin approval. Recycler accounts can request approved materials after registration.</div>
          </div>
          <button className="btn ghost sm" onClick={onClose}>Close</button>
        </div>

        <div className="role-select-grid">
          {REGISTER_ROLE_OPTIONS.map((role) => (
            <button
              key={role.value}
              type="button"
              className={`role-choice ${form.role === role.value ? "active" : ""}`}
              onClick={() => setForm({ ...form, role: role.value })}
            >
              <b>{role.label}</b>
              <span>{role.text}</span>
            </button>
          ))}
        </div>

        <div className="form-grid inline-form">
          <div className="full">
            <label className="stat-l">Company Name</label>
            <input className="input" value={form.companyName} onChange={update("companyName")} placeholder="Example Recycling Ltd" />
          </div>
          <div>
            <label className="stat-l">Contact Name</label>
            <input className="input" value={form.name} onChange={update("name")} placeholder="Your full name" />
          </div>
          <div>
            <label className="stat-l">Phone</label>
            <input className="input" value={form.phone} onChange={update("phone")} placeholder="078..." />
          </div>
          <div>
            <label className="stat-l">Email</label>
            <input className="input" value={form.email} onChange={update("email")} placeholder="company@example.com" autoComplete="email" />
          </div>
          <div>
            <label className="stat-l">Password</label>
            <input className="input" type="password" value={form.password} onChange={update("password")} placeholder="At least 6 characters" autoComplete="new-password" />
          </div>

          {form.role === "PRODUCER" && (
            <div className="full producer-approval-form">
              <div className="profile-title">Producer Approval Details</div>
              <div className="form-grid inline-form">
                <div>
                  <label className="stat-l">RDB Registration Number</label>
                  <input className="input" value={form.registrationNumber} onChange={update("registrationNumber")} placeholder="RDB-..." />
                </div>
                <div>
                  <label className="stat-l">Business Location</label>
                  <input className="input" value={form.businessLocation} onChange={update("businessLocation")} placeholder="Gikondo, Kigali" />
                </div>
                <div className="full">
                  <label className="stat-l">What do you produce?</label>
                  <textarea
                    className="input"
                    rows="3"
                    value={form.producedMaterials}
                    onChange={update("producedMaterials")}
                    placeholder="Plastic packaging, metal parts, paper boxes, organic products..."
                  />
                </div>
                <div className="full">
                  <label className="stat-l">Producer Profile</label>
                  <textarea
                    className="input"
                    rows="3"
                    value={form.productionDescription}
                    onChange={update("productionDescription")}
                    placeholder="Briefly explain your production activity and the waste streams you want to list."
                  />
                </div>
                <div className="full">
                  <label className="stat-l">RDB Document</label>
                  <label className="upload-box compact-upload">
                    <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={chooseDocument} disabled={documentBusy || busy} />
                    <span>{documentBusy ? "Preparing document..." : (form.rdbDocumentName || "Upload one RDB document")}</span>
                    <small>PDF, PNG, JPG or WEBP. This is reviewed by admin before approval.</small>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && <div className="err">{error}</div>}
        <button className="btn block green" disabled={busy} onClick={submit}>
          {busy ? "Registering..." : "Create company account"}
        </button>
      </div>
    </div>
  );
}

function readCompanyDocument(file) {
  return new Promise((resolve, reject) => {
    if (!/^(application\/pdf|image\/(png|jpe?g|webp))$/i.test(file.type)) {
      reject(new Error("Choose a PDF, PNG, JPG or WEBP RDB document."));
      return;
    }
    if (file.size > MAX_RDB_DOCUMENT_SIZE) {
      reject(new Error("Choose an RDB document under 4 MB."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read RDB document."));
    reader.onload = () => resolve({ name: file.name, dataUrl: reader.result });
    reader.readAsDataURL(file);
  });
}
