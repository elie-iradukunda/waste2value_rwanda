const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const { sequelize, Company, User, Category, WasteListing, WasteRequest, TransportJob, Certificate, Transaction } = require("./models");

class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const forbid = (message) => { throw new AppError(403, message); };
const bad = (message) => { throw new AppError(400, message); };
const notFound = (message) => { throw new AppError(404, message); };
const MAX_LISTING_IMAGES = 6;
const MAX_LISTING_IMAGE_BYTES = 6_000_000;
const MAX_PROOF_IMAGE_LENGTH = 1_500_000;
const MOVEMENT_CONDITIONS = ["GOOD", "PARTIAL", "DAMAGED", "CONTAMINATED"];

async function log(transaction, { type, message, actorId, listingId, meta }) {
  await Transaction.create(
    { type, message, actorId: actorId || null, listingId: listingId || null, meta: meta || null },
    { transaction }
  );
}

async function assertApprovedCompany(companyId) {
  const company = await Company.findByPk(companyId);
  if (!company) notFound("Company not found");
  if (company.status !== "APPROVED") forbid("Your company is not approved yet");
  return company;
}

function cleanImageDataUrl(imageDataUrl) {
  if (!imageDataUrl) return null;
  if (typeof imageDataUrl !== "string") bad("Material image must be a valid image upload");
  if (!/^data:image\/(png|jpe?g|webp);base64,/i.test(imageDataUrl)) {
    bad("Material image must be PNG, JPG or WEBP");
  }
  if (imageDataUrl.length > 4_000_000) {
    bad("Material image is too large. Upload a smaller image.");
  }
  return imageDataUrl;
}

function cleanImageGallery(data = {}) {
  const images = [];
  const add = (image) => {
    const cleaned = cleanImageDataUrl(image);
    if (cleaned && !images.includes(cleaned)) images.push(cleaned);
  };

  if (Array.isArray(data.imageGallery)) data.imageGallery.forEach(add);
  if (Array.isArray(data.imageDataUrls)) data.imageDataUrls.forEach(add);
  add(data.imageDataUrl);

  if (images.length > MAX_LISTING_IMAGES) {
    bad(`Upload up to ${MAX_LISTING_IMAGES} material images`);
  }
  if (images.reduce((total, image) => total + image.length, 0) > MAX_LISTING_IMAGE_BYTES) {
    bad("Material images are too large. Upload fewer or smaller images.");
  }

  return images;
}

function cleanListingPrice(data = {}) {
  const priceAmount = data.priceAmount;
  const currency = String(data.currency || "RWF").trim().toUpperCase();
  const priceType = String(data.priceType || "PER_UNIT").trim().toUpperCase();

  if (priceAmount == null || priceAmount === "") {
    return {
      priceAmount: null,
      currency: /^[A-Z]{3,8}$/.test(currency) ? currency : "RWF",
      priceType: priceType === "TOTAL" ? "TOTAL" : "PER_UNIT"
    };
  }

  const numericPrice = Number(priceAmount);
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) bad("Material price must be greater than zero");
  if (!/^[A-Z]{3,8}$/.test(currency)) bad("Currency must be a valid short code such as RWF or USD");

  return {
    priceAmount: numericPrice,
    currency,
    priceType: priceType === "TOTAL" ? "TOTAL" : "PER_UNIT"
  };
}

function cleanRequestPayload(user, data = {}, listing) {
  const payload = typeof data === "string" ? { message: data } : (data || {});
  const requestedQuantity = payload.requestedQuantity == null || payload.requestedQuantity === ""
    ? null
    : Number(payload.requestedQuantity);
  const proposedPrice = payload.proposedPrice == null || payload.proposedPrice === ""
    ? null
    : Number(payload.proposedPrice);
  const preferredPickupDate = String(payload.preferredPickupDate || "").trim();

  if (requestedQuantity != null && (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0)) {
    bad("Requested quantity must be greater than zero");
  }
  if (requestedQuantity != null && Number(listing.quantity || 0) > 0 && requestedQuantity > Number(listing.quantity)) {
    bad("Requested quantity cannot exceed the available material quantity");
  }
  if (proposedPrice != null && (!Number.isFinite(proposedPrice) || proposedPrice <= 0)) {
    bad("Proposed price must be greater than zero");
  }
  if (preferredPickupDate && Number.isNaN(new Date(preferredPickupDate).getTime())) {
    bad("Preferred pickup date is not valid");
  }

  return {
    message: String(payload.message || "").trim() || null,
    requestedQuantity,
    requestedUnit: String(payload.requestedUnit || listing.unit || "KG").trim().toUpperCase().slice(0, 12),
    proposedPrice,
    contactName: String(payload.contactName || user.name || "").trim() || null,
    contactPhone: String(payload.contactPhone || "").trim() || null,
    preferredPickupDate: preferredPickupDate || null,
    deliveryLocation: String(payload.deliveryLocation || "").trim() || null
  };
}

function cleanReceiptPayload(user, data = {}, listing) {
  const receivedQuantity = data.receivedQuantity == null || data.receivedQuantity === ""
    ? Number(listing.quantity)
    : Number(data.receivedQuantity);
  const receiptCondition = String(data.receiptCondition || "").trim().toUpperCase();
  const receiverName = String(data.receiverName || user.name || "").trim();
  const receiverPhone = String(data.receiverPhone || "").trim();
  const receiptLocation = String(data.receiptLocation || "").trim();
  const receiptNotes = String(data.receiptNotes || "").trim();

  if (!data.finalApproval) bad("Final receipt approval is required before certificate generation");
  if (!Number.isFinite(receivedQuantity) || receivedQuantity <= 0) bad("Received quantity must be greater than zero");
  if (Number(listing.quantity || 0) > 0 && receivedQuantity > Number(listing.quantity)) {
    bad("Received quantity cannot exceed the delivered material quantity");
  }
  if (!["GOOD", "PARTIAL", "DAMAGED", "CONTAMINATED"].includes(receiptCondition)) {
    bad("Receipt condition is required");
  }
  if (!receiverName) bad("Receiver name is required");
  if (!receiverPhone) bad("Receiver phone is required");
  if (!receiptLocation) bad("Receipt location is required");

  return {
    receivedQuantity,
    receivedUnit: String(data.receivedUnit || listing.unit || "KG").trim().toUpperCase(),
    receiptCondition,
    receiverName,
    receiverPhone,
    receiptLocation,
    receiptNotes: receiptNotes || null
  };
}

function cleanProofImageDataUrl(imageDataUrl) {
  if (!imageDataUrl) return null;
  if (typeof imageDataUrl !== "string") bad("Proof photo must be a valid image upload");
  if (!/^data:image\/(png|jpe?g|webp);base64,/i.test(imageDataUrl)) {
    bad("Proof photo must be PNG, JPG or WEBP");
  }
  if (imageDataUrl.length > MAX_PROOF_IMAGE_LENGTH) {
    bad("Proof photo is too large. Upload a smaller image.");
  }
  return imageDataUrl;
}

function cleanRequiredText(value, label, max = 160) {
  const text = String(value || "").trim();
  if (!text) bad(`${label} is required`);
  return text.slice(0, max);
}

function cleanOptionalText(value, max = 1000) {
  const text = String(value || "").trim();
  return text ? text.slice(0, max) : null;
}

function cleanMovementUnit(value, fallback) {
  return String(value || fallback || "KG").trim().toUpperCase().slice(0, 12) || "KG";
}

function cleanMovementCondition(value, label) {
  const condition = String(value || "").trim().toUpperCase();
  if (!MOVEMENT_CONDITIONS.includes(condition)) bad(`${label} is required`);
  return condition;
}

function cleanMovementQuantity(value, fallback, max, label) {
  const number = value == null || value === "" ? Number(fallback) : Number(value);
  if (!Number.isFinite(number) || number <= 0) bad(`${label} must be greater than zero`);
  if (Number(max || 0) > 0 && number > Number(max)) bad(`${label} cannot exceed the material quantity`);
  return number;
}

function cleanTransportProofPayload(user, data = {}, job, next) {
  const listing = job.listing || {};

  if (next === "PICKED_UP") {
    const maxQuantity = Number(listing.quantity || 0);
    return {
      driverName: cleanRequiredText(data.driverName || user.name, "Driver name"),
      driverPhone: cleanRequiredText(data.driverPhone, "Driver phone", 40),
      vehiclePlate: cleanRequiredText(data.vehiclePlate, "Vehicle plate", 40).toUpperCase(),
      pickupQuantity: cleanMovementQuantity(data.pickupQuantity, listing.quantity, maxQuantity, "Pickup quantity"),
      pickupUnit: cleanMovementUnit(data.pickupUnit, listing.unit),
      pickupCondition: cleanMovementCondition(data.pickupCondition, "Pickup condition"),
      pickupNotes: cleanOptionalText(data.pickupNotes),
      pickupPhotoDataUrl: cleanProofImageDataUrl(data.pickupPhotoDataUrl),
      pickedUpAt: new Date()
    };
  }

  if (next === "DELIVERED") {
    const maxQuantity = Number(job.pickupQuantity || listing.quantity || 0);
    const deliveryLocation = cleanRequiredText(data.deliveryLocation || job.dropoffLocation, "Delivery location", 220);
    return {
      deliveryQuantity: cleanMovementQuantity(data.deliveryQuantity, job.pickupQuantity || listing.quantity, maxQuantity, "Delivery quantity"),
      deliveryUnit: cleanMovementUnit(data.deliveryUnit, job.pickupUnit || listing.unit),
      deliveryCondition: cleanMovementCondition(data.deliveryCondition, "Delivery condition"),
      deliveryLocation,
      dropoffLocation: deliveryLocation,
      receiverName: cleanRequiredText(data.receiverName, "Receiver name"),
      receiverPhone: cleanRequiredText(data.receiverPhone, "Receiver phone", 40),
      deliveryNotes: cleanOptionalText(data.deliveryNotes),
      deliveryPhotoDataUrl: cleanProofImageDataUrl(data.deliveryPhotoDataUrl),
      deliveredAt: new Date()
    };
  }

  return {};
}

async function buildRecyclerTrustProfile(companyId) {
  if (!companyId) return null;

  const [
    company,
    contactUser,
    totalRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    certificatesIssued,
    recoveredKg,
    latestCertificate
  ] = await Promise.all([
    Company.findByPk(companyId),
    User.findOne({ where: { companyId }, order: [["createdAt", "ASC"]], attributes: ["id", "name", "email", "role", "createdAt"] }),
    WasteRequest.count({ where: { recyclerCompanyId: companyId } }),
    WasteRequest.count({ where: { recyclerCompanyId: companyId, status: "PENDING" } }),
    WasteRequest.count({ where: { recyclerCompanyId: companyId, status: "APPROVED" } }),
    WasteRequest.count({ where: { recyclerCompanyId: companyId, status: "REJECTED" } }),
    Certificate.count({ where: { recyclerCompanyId: companyId } }),
    Certificate.sum("quantity", { where: { recyclerCompanyId: companyId } }),
    Certificate.findOne({ where: { recyclerCompanyId: companyId }, order: [["issuedAt", "DESC"]] })
  ]);

  const trustSignals = [];
  if (company?.status === "APPROVED") trustSignals.push("Company is approved on the platform");
  if (certificatesIssued) trustSignals.push(`${certificatesIssued} certificate${certificatesIssued === 1 ? "" : "s"} issued after completed deliveries`);
  if (approvedRequests) trustSignals.push(`${approvedRequests} approved material request${approvedRequests === 1 ? "" : "s"}`);
  if (!rejectedRequests) trustSignals.push("No rejected requests recorded");

  return {
    company: company ? company.toJSON() : null,
    contactUser: contactUser ? contactUser.toJSON() : null,
    stats: {
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      certificatesIssued,
      recoveredKg: Number(recoveredKg || 0)
    },
    latestCertificate: latestCertificate ? latestCertificate.toJSON() : null,
    trustSignals
  };
}

const certificateCompanyAttributes = [
  "id",
  "name",
  "type",
  "contactEmail",
  "phone",
  "status",
  "registrationNumber",
  "businessLocation",
  "producedMaterials",
  "productionDescription",
  "rdbDocumentName",
  "createdAt"
];
const transportStaffAttributes = ["id", "name", "email", "role", "companyId", "createdAt"];
const certificateInclude = [
  {
    model: WasteListing,
    as: "listing",
    include: [
      { model: Category, as: "category" },
      {
        model: TransportJob,
        as: "job",
        include: [
          { model: Company, as: "providerCompany", attributes: certificateCompanyAttributes },
          { model: User, as: "handledBy", attributes: ["id", "name", "email", "role"] }
        ]
      }
    ]
  },
  { model: Company, as: "producerCompany", attributes: certificateCompanyAttributes },
  { model: Company, as: "recyclerCompany", attributes: certificateCompanyAttributes }
];

const LISTING_STATUS_VALUES = ["PENDING_APPROVAL", "APPROVED", "REJECTED", "MATCHED", "IN_TRANSIT", "DELIVERED", "CERTIFIED"];

function cleanListingStatus(status) {
  const value = String(status || "").trim().toUpperCase();
  if (!LISTING_STATUS_VALUES.includes(value)) bad("Unsupported listing status");
  return value;
}

function cleanCategoryName(name) {
  const value = String(name || "").trim().replace(/\s+/g, " ");
  if (!value) bad("Category name is required");
  if (value.length > 80) bad("Category name is too long");
  return value;
}

const adminListingInclude = [
  { model: Category, as: "category" },
  { model: Company, as: "producerCompany", attributes: certificateCompanyAttributes },
  {
    model: WasteRequest,
    as: "requests",
    required: false,
    include: [
      { model: Company, as: "recyclerCompany", attributes: certificateCompanyAttributes },
      { model: User, as: "createdBy", attributes: ["id", "name", "email", "role", "createdAt"] }
    ]
  },
  {
    model: TransportJob,
    as: "job",
    required: false,
    include: [
      { model: Company, as: "providerCompany", attributes: certificateCompanyAttributes },
      { model: User, as: "handledBy", attributes: ["id", "name", "email", "role"] }
    ]
  },
  { model: Certificate, as: "certificate", required: false }
];

async function buildCategorySummary(category) {
  const statusRows = await WasteListing.findAll({
    where: { categoryId: category.id },
    attributes: ["status", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
    group: ["status"],
    raw: true
  });
  const statusCounts = Object.fromEntries(LISTING_STATUS_VALUES.map((status) => [status, 0]));
  for (const row of statusRows) statusCounts[row.status] = Number(row.count || 0);

  const totalListings = Object.values(statusCounts).reduce((sum, count) => sum + Number(count || 0), 0);
  const recentListings = await WasteListing.findAll({
    where: { categoryId: category.id },
    include: adminListingInclude,
    order: [["createdAt", "DESC"]],
    limit: 6
  });

  return {
    ...category.toJSON(),
    totalListings,
    pendingListings: statusCounts.PENDING_APPROVAL,
    approvedListings: statusCounts.APPROVED,
    activeListings: ["APPROVED", "MATCHED", "IN_TRANSIT", "DELIVERED"].reduce((sum, status) => sum + statusCounts[status], 0),
    certifiedListings: statusCounts.CERTIFIED,
    rejectedListings: statusCounts.REJECTED,
    statusCounts,
    canDelete: totalListings === 0,
    recentListings
  };
}

const publicSite = {
  marketplace: () =>
    WasteListing.findAll({
      where: { status: "APPROVED" },
      include: [
        { model: Category, as: "category" },
        { model: Company, as: "producerCompany", attributes: certificateCompanyAttributes }
      ],
      order: [["createdAt", "DESC"]],
      limit: 8
    }),

  producers: async () => {
    const companies = await Company.findAll({
      where: { type: "PRODUCER", status: "APPROVED" },
      attributes: certificateCompanyAttributes,
      order: [["createdAt", "DESC"]],
      limit: 8
    });

    return Promise.all(companies.map(async (company) => {
      const [materials, certificateCount] = await Promise.all([
        WasteListing.findAll({
          where: {
            producerCompanyId: company.id,
            status: { [Op.in]: ["APPROVED", "MATCHED", "IN_TRANSIT", "DELIVERED", "CERTIFIED"] }
          },
          include: [{ model: Category, as: "category" }, { model: Certificate, as: "certificate", required: false }],
          order: [["createdAt", "DESC"]],
          limit: 6
        }),
        Certificate.count({ where: { producerCompanyId: company.id } })
      ]);
      const categories = [...new Set(materials.map((listing) => listing.category?.name).filter(Boolean))];

      return {
        ...company.toJSON(),
        certificateCount,
        materialCount: materials.length,
        categories,
        materials
      };
    }));
  }
};

const admin = {
  listPendingCompanies: () =>
    Company.findAll({
      where: { status: "PENDING", type: "PRODUCER" },
      include: [{ model: User, as: "users", attributes: ["id", "name", "email", "role", "createdAt"] }],
      order: [["createdAt", "DESC"]]
    }),

  reviewCompany: async (adminUser, companyId, approve) => {
    const company = await Company.findByPk(companyId);
    if (!company) notFound("Company not found");

    const status = approve ? "APPROVED" : "REJECTED";
    await company.update({ status });
    await log(null, {
      type: approve ? "COMPANY_APPROVED" : "COMPANY_REJECTED",
      message: `${company.name} ${approve ? "approved" : "rejected"} by admin`,
      actorId: adminUser.id
    });
    return company;
  },

  listPendingListings: () =>
    WasteListing.findAll({
      where: { status: "PENDING_APPROVAL" },
      include: adminListingInclude,
      order: [["createdAt", "DESC"]]
    }),

  listListingsByStatus: (status) =>
    WasteListing.findAll({
      where: { status: cleanListingStatus(status) },
      include: adminListingInclude,
      order: [["createdAt", "DESC"]]
    }),

  listCategories: async () => {
    const categoryRows = await Category.findAll({ order: [["name", "ASC"]] });
    return Promise.all(categoryRows.map(buildCategorySummary));
  },

  reviewListing: async (adminUser, listingId, approve, quality) => {
    const listing = await WasteListing.findByPk(listingId);
    if (!listing) notFound("Listing not found");
    if (listing.status !== "PENDING_APPROVAL") bad("Listing is not awaiting approval");
    if (approve && !["A", "B", "C"].includes(quality)) bad("Quality grade (A/B/C) is required");

    await listing.update(approve ? { status: "APPROVED", quality } : { status: "REJECTED" });
    await log(null, {
      type: approve ? "LISTING_APPROVED" : "LISTING_REJECTED",
      message: `${listing.title} ${approve ? `approved (quality ${quality})` : "rejected"}`,
      actorId: adminUser.id,
      listingId
    });
    return listing;
  },

  addCategory: async (name) => {
    const cleanName = cleanCategoryName(name);
    const existing = await Category.findOne({ where: { name: cleanName } });
    if (existing) bad("A category with this name already exists");
    const category = await Category.create({ name: cleanName });
    return buildCategorySummary(category);
  },

  updateCategory: async (id, name) => {
    const category = await Category.findByPk(id);
    if (!category) notFound("Category not found");
    const cleanName = cleanCategoryName(name);
    const existing = await Category.findOne({ where: { name: cleanName, id: { [Op.ne]: id } } });
    if (existing) bad("A category with this name already exists");
    await category.update({ name: cleanName });
    return buildCategorySummary(category);
  },

  deleteCategory: async (id) => {
    const category = await Category.findByPk(id);
    if (!category) notFound("Category not found");
    const usedBy = await WasteListing.count({ where: { categoryId: id } });
    if (usedBy > 0) bad(`Cannot remove "${category.name}" because ${usedBy} material${usedBy === 1 ? "" : "s"} use it`);
    await category.destroy();
    return { deleted: true, id: Number(id), name: category.name };
  },

  reports: async () => {
    const [byStatusRaw, certifiedSum, certificatesIssued, activeListings, totalCompanies, recentTransactions] = await Promise.all([
      WasteListing.findAll({ attributes: ["status", [sequelize.fn("COUNT", sequelize.col("id")), "count"]], group: ["status"], raw: true }),
      WasteListing.sum("quantity", { where: { status: "CERTIFIED" } }),
      Certificate.count(),
      WasteListing.count({ where: { status: { [Op.in]: ["APPROVED", "MATCHED", "IN_TRANSIT", "DELIVERED"] } } }),
      Company.count(),
      Transaction.findAll({ order: [["createdAt", "DESC"]], limit: 20 })
    ]);

    return {
      wasteDivertedKg: Number(certifiedSum || 0),
      certificatesIssued,
      activeListings,
      totalCompanies,
      listingsByStatus: byStatusRaw.map((row) => ({ status: row.status, count: Number(row.count) })),
      recentTransactions
    };
  }
};

const producer = {
  createListing: async (user, data) => {
    await assertApprovedCompany(user.companyId);
    if (!data.title || !data.categoryId || !data.quantity || !data.location) bad("Missing required fields");
    const images = cleanImageGallery(data);
    const price = cleanListingPrice(data);

    return WasteListing.create({
      title: data.title,
      description: data.description || null,
      imageDataUrl: images[0] || null,
      imageGallery: images,
      quantity: data.quantity,
      unit: data.unit || "KG",
      ...price,
      location: data.location,
      lat: data.lat || null,
      lng: data.lng || null,
      categoryId: data.categoryId,
      producerCompanyId: user.companyId,
      createdById: user.id,
      status: "PENDING_APPROVAL"
    });
  },

  myListings: (user) =>
    WasteListing.findAll({
      where: { producerCompanyId: user.companyId },
      include: [{ model: Category, as: "category" }, { model: TransportJob, as: "job" }],
      order: [["createdAt", "DESC"]]
    }),

  updateListing: async (user, id, data) => {
    const listing = await WasteListing.findByPk(id);
    if (!listing) notFound("Listing not found");
    if (listing.producerCompanyId !== user.companyId) forbid("Not your listing");
    if (!["PENDING_APPROVAL", "APPROVED"].includes(listing.status)) bad("Listing can no longer be edited");

    const priceUpdate = ["priceAmount", "currency", "priceType"].some((key) => Object.prototype.hasOwnProperty.call(data, key))
      ? cleanListingPrice(data)
      : {};

    return listing.update({
      ...(data.quantity != null ? { quantity: data.quantity } : {}),
      ...(data.location ? { location: data.location } : {}),
      ...priceUpdate
    });
  },

  incomingRequests: async (user) => {
    const requests = await WasteRequest.findAll({
      where: { status: "PENDING" },
      include: [
        { model: WasteListing, as: "listing", where: { producerCompanyId: user.companyId }, include: [{ model: Category, as: "category" }] },
        { model: Company, as: "recyclerCompany" },
        { model: User, as: "createdBy", attributes: ["id", "name", "email", "role"] }
      ],
      order: [["createdAt", "DESC"]]
    });

    return Promise.all(requests.map(async (request) => {
      const plain = request.toJSON();
      plain.recyclerProfile = await buildRecyclerTrustProfile(plain.recyclerCompanyId);
      return plain;
    }));
  },

  reviewRequest: (user, requestId, approve, reason) =>
    sequelize.transaction(async (transaction) => {
      const decisionReason = String(reason || "").trim();
      if (!decisionReason) bad("Decision reason is required");

      const request = await WasteRequest.findByPk(requestId, {
        include: [{ model: WasteListing, as: "listing" }],
        transaction
      });
      if (!request) notFound("Request not found");
      if (request.listing.producerCompanyId !== user.companyId) forbid("Not your listing");
      if (request.status !== "PENDING") bad("Request already handled");

      if (!approve) {
        await request.update({ status: "REJECTED", decisionReason }, { transaction });
        await log(transaction, {
          type: "REQUEST_REJECTED",
          message: `${request.listing.title} request rejected - ${decisionReason}`,
          actorId: user.id,
          listingId: request.listingId
        });
        return { request };
      }

      if (request.listing.status !== "APPROVED") bad("Listing is not available for matching");

      await request.update({ status: "APPROVED", decisionReason }, { transaction });
      await WasteRequest.update(
        { status: "REJECTED", decisionReason: "Another recycler request was approved for this listing." },
        { where: { listingId: request.listingId, status: "PENDING", id: { [Op.ne]: requestId } }, transaction }
      );
      await WasteListing.update({ status: "MATCHED" }, { where: { id: request.listingId }, transaction });
      const job = await TransportJob.create(
        {
          listingId: request.listingId,
          status: "WAITING",
          pickupLocation: request.listing.location,
          dropoffLocation: request.deliveryLocation,
          providerCompanyId: user.companyId
        },
        { transaction }
      );
      await log(transaction, {
        type: "REQUEST_MATCHED",
        message: `${request.listing.title} matched with a buyer - ${decisionReason}`,
        actorId: user.id,
        listingId: request.listingId
      });
      return { request: { id: requestId, status: "APPROVED", decisionReason }, job };
    }),

  myCertificates: (user) =>
    Certificate.findAll({
      where: { producerCompanyId: user.companyId },
      include: certificateInclude,
      order: [["issuedAt", "DESC"]]
    }),

  transportStaff: (user) =>
    User.findAll({
      where: { companyId: user.companyId, role: "TRANSPORT" },
      attributes: transportStaffAttributes,
      order: [["createdAt", "DESC"]]
    }),

  createTransportStaff: async (user, data = {}) => {
    await assertApprovedCompany(user.companyId);
    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim().toLowerCase();
    const password = String(data.password || "");

    if (!name || !email || !password) bad("Transport staff name, email and password are required");
    if (password.length < 6) bad("Transport staff password must be at least 6 characters");

    const existing = await User.findOne({ where: { email } });
    if (existing) bad("An account with this email already exists");

    const passwordHash = await bcrypt.hash(password, 10);
    const staff = await User.create({
      name,
      email,
      passwordHash,
      role: "TRANSPORT",
      companyId: user.companyId
    });

    await log(null, {
      type: "TRANSPORT_STAFF_CREATED",
      message: `${name} transport staff account created by producer`,
      actorId: user.id
    });

    return {
      user: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        companyId: staff.companyId,
        createdAt: staff.createdAt
      },
      credentials: { email: staff.email, password }
    };
  }
};

const recycler = {
  marketplace: ({ q, categoryId } = {}) =>
    WasteListing.findAll({
      where: {
        status: "APPROVED",
        ...(categoryId ? { categoryId } : {}),
        ...(q ? { [Op.or]: [{ title: { [Op.like]: `%${q}%` } }, { location: { [Op.like]: `%${q}%` } }] } : {})
      },
      include: [
        { model: Category, as: "category" },
        { model: Company, as: "producerCompany", attributes: ["id", "name", "type", "contactEmail", "phone", "status", "createdAt"] }
      ],
      order: [["createdAt", "DESC"]]
    }),

  createRequest: async (user, listingId, data) => {
    await assertApprovedCompany(user.companyId);
    const listing = await WasteListing.findByPk(listingId);
    if (!listing) notFound("Listing not found");
    if (listing.status !== "APPROVED") bad("Listing is not available to request");

    const existing = await WasteRequest.findOne({
      where: { listingId, recyclerCompanyId: user.companyId, status: { [Op.in]: ["PENDING", "APPROVED"] } }
    });
    if (existing) bad("You already have an active request for this listing");
    const requestInfo = cleanRequestPayload(user, data, listing);

    return WasteRequest.create({
      listingId,
      recyclerCompanyId: user.companyId,
      createdById: user.id,
      ...requestInfo,
      status: "PENDING"
    });
  },

  myRequests: (user) =>
    WasteRequest.findAll({
      where: { recyclerCompanyId: user.companyId },
      include: [{
        model: WasteListing,
        as: "listing",
        include: [
          { model: TransportJob, as: "job" },
          { model: Category, as: "category" },
          { model: Company, as: "producerCompany", attributes: ["id", "name", "type", "contactEmail", "phone", "status", "createdAt"] }
        ]
      }],
      order: [["createdAt", "DESC"]]
    }),

  confirmReceipt: (user, listingId, data = {}) =>
    sequelize.transaction(async (transaction) => {
      const listing = await WasteListing.findByPk(listingId, {
        include: [{ model: Category, as: "category" }],
        transaction
      });
      if (!listing) notFound("Listing not found");
      if (listing.status !== "DELIVERED") bad("Listing has not been delivered yet");

      const request = await WasteRequest.findOne({
        where: { listingId, recyclerCompanyId: user.companyId, status: "APPROVED" },
        transaction
      });
      if (!request) forbid("You are not the approved buyer for this listing");
      const receipt = cleanReceiptPayload(user, data, listing);

      await listing.update({ status: "CERTIFIED" }, { transaction });
      const serial = `WTV-CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const certificate = await Certificate.create({
        id: serial,
        listingId,
        quantity: receipt.receivedQuantity,
        unit: receipt.receivedUnit,
        category: listing.category.name,
        receiptCondition: receipt.receiptCondition,
        receiverName: receipt.receiverName,
        receiverPhone: receipt.receiverPhone,
        receiptLocation: receipt.receiptLocation,
        receiptNotes: receipt.receiptNotes,
        receiptConfirmedAt: new Date(),
        producerCompanyId: listing.producerCompanyId,
        recyclerCompanyId: user.companyId
      }, { transaction });
      await log(transaction, {
        type: "CERTIFIED",
        message: `${listing.title} (${receipt.receivedQuantity}${receipt.receivedUnit}) received in ${receipt.receiptCondition.toLowerCase()} condition - certificate ${serial} issued`,
        actorId: user.id,
        listingId
      });
      return certificate;
    }),

  myCertificates: (user) =>
    Certificate.findAll({
      where: { recyclerCompanyId: user.companyId },
      include: certificateInclude,
      order: [["issuedAt", "DESC"]]
    })
};

const JOB_NEXT = { WAITING: "PICKED_UP", PICKED_UP: "IN_TRANSIT", IN_TRANSIT: "DELIVERED" };
const transportJobInclude = [
  {
    model: WasteListing,
    as: "listing",
    include: [
      { model: Category, as: "category" },
      { model: Company, as: "producerCompany", attributes: certificateCompanyAttributes },
      {
        model: WasteRequest,
        as: "requests",
        where: { status: "APPROVED" },
        required: false,
        include: [
          { model: Company, as: "recyclerCompany", attributes: certificateCompanyAttributes },
          { model: User, as: "createdBy", attributes: ["id", "name", "email", "role"] }
        ]
      }
    ]
  },
  { model: Company, as: "providerCompany", attributes: certificateCompanyAttributes },
  { model: User, as: "handledBy", attributes: ["id", "name", "email", "role"] }
];

const transport = {
  jobs: async (user) => {
    await assertApprovedCompany(user.companyId);
    return TransportJob.findAll({
      where: { providerCompanyId: user.companyId },
      include: transportJobInclude,
      order: [["createdAt", "DESC"]]
    });
  },

  advance: (user, jobId, data = {}) =>
    sequelize.transaction(async (transaction) => {
      await assertApprovedCompany(user.companyId);
      const job = await TransportJob.findByPk(jobId, {
        include: [{ model: WasteListing, as: "listing" }],
        transaction
      });
      if (!job) notFound("Job not found");
      if (job.providerCompanyId !== user.companyId) forbid("Job is not assigned to your transport team");

      const next = JOB_NEXT[job.status];
      if (!next) bad("Job is already delivered");
      const movementProof = cleanTransportProofPayload(user, data, job, next);

      await job.update({
        status: next,
        providerCompanyId: user.companyId,
        handledById: job.handledById || user.id,
        ...movementProof
      }, { transaction });

      if (next === "IN_TRANSIT") {
        await WasteListing.update({ status: "IN_TRANSIT" }, { where: { id: job.listingId }, transaction });
      }

      if (next === "DELIVERED") {
        await WasteListing.update({ status: "DELIVERED" }, { where: { id: job.listingId }, transaction });
        await log(transaction, {
          type: "DELIVERED",
          message: `${job.listing.title} delivered to buyer - awaiting confirmation`,
          actorId: user.id,
          listingId: job.listingId
        });
      }

      return TransportJob.findByPk(job.id, { include: transportJobInclude, transaction });
    })
};

const categories = {
  list: () => Category.findAll({ order: [["name", "ASC"]] })
};

module.exports = { AppError, publicSite, admin, producer, recycler, transport, categories };
