const QRCode = require("qrcode");
const data = require("../data/mockData");

const ok = (res, payload) => res.json({ success: true, ...payload });

const resourceMap = {
  Material: data.materials,
  Request: data.materialRequests,
  "Transport job": data.transportJobs,
  Transaction: data.transactions,
  "Company verification": data.companies,
  Approval: data.dashboard.admin.approvals
};

function nextId(items) {
  return Math.max(0, ...items.map((item) => Number(item.id) || 0)) + 1;
}

function statusTone(status = "") {
  const normalized = status.toLowerCase();
  if (normalized.includes("reject") || normalized.includes("risk")) return "red";
  if (normalized.includes("pending") || normalized.includes("review") || normalized.includes("transit")) return "orange";
  if (normalized.includes("assign") || normalized.includes("view")) return "blue";
  return "green";
}

function appBaseUrl(req) {
  if (process.env.PUBLIC_APP_URL) return process.env.PUBLIC_APP_URL.replace(/\/$/, "");
  const protocol = req.get("x-forwarded-proto") || req.protocol || "http";
  const host = req.get("x-forwarded-host") || req.get("host") || "localhost:5173";
  return `${protocol}://${host}`.replace(/\/$/, "");
}

async function certificateWithQr(certificate, req, includeQr = false) {
  const verificationUrl = `${appBaseUrl(req)}/certificates?verify=${encodeURIComponent(certificate.certificateNumber)}`;
  const enriched = {
    ...certificate,
    verificationUrl,
    qrCodeUrl: verificationUrl
  };

  if (includeQr) {
    enriched.qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 180,
      errorCorrectionLevel: "M"
    });
  }

  return enriched;
}

exports.home = (_req, res) => ok(res, {
  stats: [
    { label: "Kg diverted today", value: "1,260+" },
    { label: "Active companies", value: "48" },
    { label: "Completed exchanges", value: "32" },
    { label: "Reuse success", value: "84%" }
  ],
  featuredMaterials: data.materials.slice(0, 3),
  roles: [
    { role: "admin", title: "Admin", duties: ["manage users", "approve listings", "view dashboard reports"] },
    { role: "industry", title: "Waste Producer", duties: ["post waste materials", "approve requests", "view reuse certificates"] },
    { role: "buyer", title: "Recycler / SME", duties: ["search materials", "request or reserve waste", "confirm received items"] },
    { role: "transporter", title: "Transport Provider", duties: ["accept pickup jobs", "update delivery status", "confirm delivery"] },
    { role: "regulator", title: "COPED / Waste Operator", duties: ["verify quality", "monitor recovery", "generate reports"] }
  ]
});

exports.dashboard = (role) => (_req, res) => ok(res, {
  role,
  dashboard: data.dashboard[role] || data.dashboard.admin,
  materials: data.materials,
  requests: data.materialRequests,
  transactions: data.transactions,
  jobs: data.transportJobs,
  certificates: data.certificates
});

exports.list = (key) => async (req, res) => {
  if (key === "certificates") {
    const certificates = await Promise.all((data.certificates || []).map((certificate) => certificateWithQr(certificate, req, true)));
    return ok(res, { certificates });
  }

  return ok(res, { [key]: data[key] || [] });
};

exports.materialDetails = (req, res) => {
  const material = data.materials.find((item) => item.id === Number(req.params.id));

  if (!material) {
    return res.status(404).json({ success: false, message: "Material not found" });
  }

  return ok(res, { material });
};

exports.createMaterial = (req, res) => {
  const quantity = Number(req.body.quantity) || req.body.quantity || 0;
  const unit = req.body.unit || "kg";
  const material = {
    id: nextId(data.materials),
    title: req.body.title || req.body.material || req.body.name || "Reusable waste material",
    category: req.body.category || "Other",
    quantity,
    unit,
    condition: req.body.condition || "Pending quality review",
    price: req.body.price || req.body.exchangePreference || "Negotiable",
    district: req.body.district || "Gasabo",
    sector: req.body.sector || "Kacyiru",
    seller: req.body.seller || req.body.companyName || "Waste Producer",
    status: "pending_review",
    match: Number(req.body.match) || 70,
    description: req.body.description || req.body.safetyNotes || "Submitted through Waste2Value Rwanda for circular economy reuse.",
    pickupAddress: req.body.pickupAddress || `${req.body.district || "Gasabo"} pickup point`,
    safetyNotes: req.body.safetyNotes || "Non-hazardous material only. Admin review required before publication.",
    photos: req.body.photos || [],
    submittedAt: new Date().toISOString(),
    ...req.body
  };

  data.materials.unshift(material);
  data.notifications.unshift({
    id: nextId(data.notifications),
    title: "New waste listing submitted",
    message: `${material.title} is waiting for admin approval.`,
    type: "material",
    isRead: false
  });

  return res.status(201).json({
    success: true,
    message: "Material submitted for approval",
    material
  });
};

exports.createRequest = (req, res) => {
  const material = data.materials.find((item) => item.id === Number(req.body.materialId));
  const request = {
    id: nextId(data.materialRequests),
    material: req.body.material || material?.title || "Requested material",
    buyer: req.body.buyer || req.body.companyName || "Recycler / SME",
    seller: req.body.seller || material?.seller || "Waste Producer",
    quantity: req.body.quantity || `${material?.quantity || ""} ${material?.unit || ""}`.trim(),
    status: "pending",
    offeredPrice: req.body.offeredPrice || req.body.price || "Negotiable",
    message: req.body.message || "Material request submitted from marketplace.",
    requestedAt: new Date().toISOString(),
    ...req.body
  };

  data.materialRequests.unshift(request);
  if (material) material.status = "requested";
  data.notifications.unshift({
    id: nextId(data.notifications),
    title: "New material request",
    message: `${request.buyer} requested ${request.material}.`,
    type: "request",
    isRead: false
  });

  return res.status(201).json({
    success: true,
    message: "Material request sent",
    request
  });
};

exports.updateStatus = (resourceName) => (req, res) => {
  const items = resourceMap[resourceName] || [];
  const id = Number(req.params.id);
  const item = items.find((entry) => Number(entry.id) === id);
  const status = req.body.status || "updated";

  if (!item) {
    return res.status(404).json({ success: false, message: `${resourceName} not found` });
  }

  item.status = status;
  item.verificationStatus = resourceName === "Company verification" ? status : item.verificationStatus;
  item.priority = item.priority || req.body.priority;
  item.updatedAt = new Date().toISOString();

  if (resourceName === "Transport job" && status.toLowerCase().includes("accepted")) {
    item.action = "Update";
    item.tone = "blue";
    data.notifications.unshift({
      id: nextId(data.notifications),
      title: "Transport job accepted",
      message: `A transport provider accepted delivery for ${item.material || "a waste material"}.`,
      type: "delivery",
      isRead: false
    });
  }

  if (resourceName === "Request" && status.toLowerCase().includes("approved")) {
    const transactionExists = data.transactions.some((transaction) => transaction.requestId === id);
    if (!transactionExists) {
      data.transactions.unshift({
        id: nextId(data.transactions),
        requestId: id,
        material: item.material,
        seller: item.seller || "Waste Producer",
        buyer: item.buyer || "Recycler / SME",
        transport: "Pending",
        status: "Approved",
        certificate: "Waiting",
        totalAmount: item.offeredPrice || "Negotiable"
      });
      data.transportJobs.unshift({
        id: nextId(data.transportJobs),
        material: item.material,
        route: `${item.seller || "Pickup"} -> ${item.buyer || "Delivery"}`,
        quantity: item.quantity || "Pending",
        status: "available",
        offer: "Negotiable"
      });
    }
  }

  return ok(res, {
    message: `${resourceName} status updated`,
    id,
    status,
    tone: statusTone(status),
    item
  });
};

exports.createTransportJob = (req, res) => {
  const job = {
    id: nextId(data.transportJobs),
    material: req.body.material || "Reusable waste material",
    route: req.body.route || `${req.body.pickup || "Kigali"} -> ${req.body.delivery || "Kigali"}`,
    quantity: req.body.quantity || "Pending",
    status: "available",
    offer: req.body.offer || "Negotiable",
    createdAt: new Date().toISOString()
  };

  data.transportJobs.unshift(job);
  return res.status(201).json({ success: true, message: "Transport job created", job });
};

exports.generateCertificate = async (req, res) => {
  const certificate = {
    id: nextId(data.certificates),
    certificateNumber: `W2V-RW-2026-${String(Date.now()).slice(-6)}`,
    materialType: req.body.materialType || req.body.material || "Reusable waste material",
    quantityReused: req.body.quantityReused || req.body.quantity || "Pending",
    sellerCompanyName: req.body.sellerCompanyName || req.body.seller || "Waste Producer",
    buyerCompanyName: req.body.buyerCompanyName || req.body.buyer || "Recycler / SME",
    transporterName: req.body.transporterName || req.body.transporter || "Transport Provider",
    deliveryStatus: req.body.deliveryStatus || "Verified and completed",
    issueDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
    verificationStatus: "verified",
    environmentalImpact: req.body.environmentalImpact || "Landfill diversion recorded by Waste2Value Rwanda"
  };

  const enrichedCertificate = await certificateWithQr(certificate, req, true);
  data.certificates.unshift(enrichedCertificate);
  data.notifications.unshift({
    id: nextId(data.notifications),
    title: "Certificate generated",
    message: `${certificate.certificateNumber} is ready for verification.`,
    type: "certificate",
    isRead: false
  });

  return res.status(201).json({
    success: true,
    message: "Certificate generated",
    certificate: enrichedCertificate
  });
};

exports.verifyCertificate = async (req, res) => {
  const certificate = data.certificates.find(
    (item) => item.certificateNumber === req.params.number || item.id === Number(req.params.number)
  );

  if (!certificate) {
    return res.status(404).json({ success: false, verified: false, message: "Certificate not found" });
  }

  return ok(res, { verified: certificate.verificationStatus === "verified", certificate: await certificateWithQr(certificate, req, true) });
};

exports.analytics = (_req, res) => ok(res, {
  dashboard: data.dashboard.analytics,
  impact: data.dashboard.regulator.impact,
  transactions: data.transactions
});

exports.notifications = (_req, res) => ok(res, {
  notifications: data.notifications
});

exports.markNotificationRead = (req, res) => {
  const notification = data.notifications.find((item) => Number(item.id) === Number(req.params.id));

  if (!notification) {
    return res.status(404).json({ success: false, message: "Notification not found" });
  }

  notification.isRead = true;
  notification.updatedAt = new Date().toISOString();

  return ok(res, {
    message: "Notification marked as read",
    notification
  });
};
