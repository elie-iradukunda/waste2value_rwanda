const bcrypt = require("bcryptjs");
const {
  User,
  Company,
  MaterialCategory,
  WasteMaterial,
  MaterialRequest,
  Transaction,
  TransportJob,
  Certificate,
  SustainabilityScore,
  Notification,
  Review
} = require("../models");

const DEMO_PASSWORD = process.env.SEED_PASSWORD || "demo123";

const categories = [
  { name: "Plastic", description: "Plastic scraps, flakes, packaging and clean offcuts.", icon: "recycle" },
  { name: "Metal", description: "Metal offcuts, dust and fabrication leftovers.", icon: "factory" },
  { name: "Wood", description: "Wood residues, sawdust and furniture offcuts.", icon: "package" },
  { name: "Paper", description: "Packaging paper, cartons and office paper.", icon: "file" },
  { name: "Textile", description: "Fabric leftovers and production remnants.", icon: "shirt" },
  { name: "Organic", description: "Reusable organic by-products.", icon: "leaf" }
];

const users = {
  admin: { fullName: "Alain Fred NIYOGUSHIMWA", email: "admin@wastetovalue.rw", phone: "0788000001", role: "admin" },
  industry: { fullName: "Eric Nkurunziza", email: "industry@wastetovalue.rw", phone: "0788000002", role: "industry" },
  industry2: { fullName: "Claudine Uwase", email: "industry2@wastetovalue.rw", phone: "0788000006", role: "industry" },
  buyer: { fullName: "Grace Mukamana", email: "buyer@wastetovalue.rw", phone: "0788000003", role: "buyer" },
  buyer2: { fullName: "Jean Bosco Habimana", email: "buyer2@wastetovalue.rw", phone: "0788000007", role: "buyer" },
  transporter: { fullName: "Patrick Habimana", email: "transport@wastetovalue.rw", phone: "0788000004", role: "transporter" },
  regulator: { fullName: "Divine Iradukunda", email: "regulator@wastetovalue.rw", phone: "0788000005", role: "regulator" }
};

const companyProfiles = {
  admin: { companyName: "Waste-to-Value Rwanda", companyType: "admin", district: "Gasabo", sector: "Kacyiru", verificationStatus: "verified", sustainabilityScore: 100 },
  industry: { companyName: "Kigali Plastics Ltd", companyType: "industry", district: "Kicukiro", sector: "Gikondo", address: "Kigali Special Economic Zone", verificationStatus: "verified", sustainabilityScore: 86 },
  industry2: { companyName: "Kigali Furniture Works", companyType: "industry", district: "Gasabo", sector: "Remera", address: "Remera production workshop", verificationStatus: "pending", sustainabilityScore: 71 },
  buyer: { companyName: "Eco Recycle Rwanda", companyType: "buyer", district: "Nyarugenge", sector: "Muhima", address: "Muhima recycling yard", verificationStatus: "verified", sustainabilityScore: 82 },
  buyer2: { companyName: "FabLab SME", companyType: "buyer", district: "Nyarugenge", sector: "Nyamirambo", address: "Nyamirambo workshop", verificationStatus: "verified", sustainabilityScore: 68 },
  transporter: { companyName: "GreenMove Logistics", companyType: "transporter", district: "Kicukiro", sector: "Gikondo", address: "Gikondo depot", verificationStatus: "verified", sustainabilityScore: 79 },
  regulator: { companyName: "COPED Group Rwanda", companyType: "regulator", district: "Gasabo", sector: "Kacyiru", address: "Utexrwa Road, KG 15 Avenue, Kacyiru", verificationStatus: "verified", sustainabilityScore: 92 }
};

const materials = [
  { owner: "industry", category: "Plastic", title: "Plastic scraps", description: "Sorted plastic scraps from industrial packaging production.", quantity: 2400, unit: "kg", condition: "Clean, mixed, dry", price: 180, district: "Kicukiro", sector: "Gikondo", pickupAddress: "Kigali Special Economic Zone", latitude: -1.969, longitude: 30.104, status: "available" },
  { owner: "industry", category: "Metal", title: "Metal offcuts", description: "Steel and aluminum offcuts suitable for local fabrication.", quantity: 700, unit: "kg", condition: "Clean fabrication offcuts", price: 0, district: "Kicukiro", sector: "Gikondo", pickupAddress: "Gikondo fabrication yard", latitude: -1.966, longitude: 30.106, status: "available" },
  { owner: "industry2", category: "Wood", title: "Wood residues", description: "Furniture production residue ready for briquette processing.", quantity: 1200, unit: "kg", condition: "Dry sawdust and offcuts", price: 60, district: "Gasabo", sector: "Remera", pickupAddress: "Remera production workshop", latitude: -1.956, longitude: 30.113, status: "available" },
  { owner: "industry2", category: "Textile", title: "Textile leftovers", description: "Clean textile leftovers for crafts, insulation or padding.", quantity: 450, unit: "kg", condition: "Mixed clean fabric", price: 0, isFree: true, district: "Nyarugenge", sector: "Nyamirambo", pickupAddress: "Nyamirambo tailoring workshop", status: "available" },
  { owner: "industry", category: "Paper", title: "Packaging paper offcuts", description: "Clean cardboard and packaging paper offcuts from production.", quantity: 600, unit: "kg", condition: "Clean, dry", price: 40, district: "Kicukiro", sector: "Gikondo", pickupAddress: "Kigali Special Economic Zone", status: "pending_review" },
  { owner: "industry2", category: "Organic", title: "Organic sawmill residue", description: "Organic residue from wood processing, suitable for composting.", quantity: 900, unit: "kg", condition: "Fresh, mixed", price: 0, isFree: true, district: "Gasabo", sector: "Remera", pickupAddress: "Remera production workshop", status: "pending_review" }
];

async function upsertByFind(model, where, values) {
  const [record, created] = await model.findOrCreate({ where, defaults: values });
  if (!created) await record.update(values);
  return record;
}

async function ensureDemoData() {
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  const categoryByName = {};
  const userByKey = {};
  const companyByKey = {};
  const materialByTitle = {};

  for (const category of categories) {
    categoryByName[category.name] = await upsertByFind(MaterialCategory, { name: category.name }, { ...category, status: "active" });
  }

  for (const [key, user] of Object.entries(users)) {
    userByKey[key] = await upsertByFind(User, { email: user.email }, { ...user, password, status: "active", resetCode: null, resetCodeExpires: null, statusReason: null });
    const company = companyProfiles[key];
    companyByKey[key] = await upsertByFind(Company, { userId: userByKey[key].id }, { ...company, userId: userByKey[key].id, email: user.email, phone: user.phone });
  }

  for (const material of materials) {
    const owner = companyByKey[material.owner];
    const category = categoryByName[material.category];
    const values = {
      companyId: owner.id,
      categoryId: category.id,
      title: material.title,
      description: material.description,
      quantity: material.quantity,
      unit: material.unit,
      condition: material.condition,
      price: material.price,
      isFree: Boolean(material.isFree),
      district: material.district,
      sector: material.sector,
      pickupAddress: material.pickupAddress,
      latitude: material.latitude || null,
      longitude: material.longitude || null,
      status: material.status,
      safetyNotes: "Non-hazardous material only. Handle using standard workplace safety practices.",
      reuseSuggestions: "Reuse through recycling, fabrication, briquette production, or SME raw-material substitution.",
      qualityVerified: ["Plastic scraps", "Metal offcuts"].includes(material.title),
      qualityVerifiedAt: ["Plastic scraps", "Metal offcuts"].includes(material.title) ? new Date() : null,
      rejectionReason: null
    };
    materialByTitle[material.title] = await upsertByFind(WasteMaterial, { title: material.title, companyId: owner.id }, values);
  }

  const plasticRequest = await upsertByFind(MaterialRequest, {
    materialId: materialByTitle["Plastic scraps"].id,
    buyerCompanyId: companyByKey.buyer.id,
    sellerCompanyId: companyByKey.industry.id
  }, {
    materialId: materialByTitle["Plastic scraps"].id,
    buyerCompanyId: companyByKey.buyer.id,
    sellerCompanyId: companyByKey.industry.id,
    requestedQuantity: 1500,
    message: "Interested in 1.5 tons of clean plastic scraps for recycling.",
    offeredPrice: 270000,
    status: "approved"
  });

  await upsertByFind(MaterialRequest, {
    materialId: materialByTitle["Metal offcuts"].id,
    buyerCompanyId: companyByKey.buyer2.id,
    sellerCompanyId: companyByKey.industry.id
  }, {
    materialId: materialByTitle["Metal offcuts"].id,
    buyerCompanyId: companyByKey.buyer2.id,
    sellerCompanyId: companyByKey.industry.id,
    requestedQuantity: 500,
    message: "FabLab SME needs metal offcuts for fabrication training.",
    offeredPrice: null,
    status: "pending"
  });

  await upsertByFind(MaterialRequest, {
    materialId: materialByTitle["Wood residues"].id,
    buyerCompanyId: companyByKey.buyer.id,
    sellerCompanyId: companyByKey.industry2.id
  }, {
    materialId: materialByTitle["Wood residues"].id,
    buyerCompanyId: companyByKey.buyer.id,
    sellerCompanyId: companyByKey.industry2.id,
    requestedQuantity: 1200,
    offeredPrice: 72000,
    message: "Requesting wood residue for briquette production.",
    status: "negotiating"
  });

  const transaction = await upsertByFind(Transaction, { requestId: plasticRequest.id }, {
    requestId: plasticRequest.id,
    materialId: materialByTitle["Plastic scraps"].id,
    buyerCompanyId: companyByKey.buyer.id,
    sellerCompanyId: companyByKey.industry.id,
    quantity: 1500,
    totalAmount: 270000,
    paymentStatus: "paid",
    transactionStatus: "delivered"
  });

  const transportJob = await upsertByFind(TransportJob, { transactionId: transaction.id }, {
    transactionId: transaction.id,
    transporterCompanyId: companyByKey.transporter.id,
    pickupLocation: "Kigali Special Economic Zone",
    deliveryLocation: "Muhima recycling yard",
    pickupDate: new Date(),
    transportCost: 42000,
    status: "delivered"
  });

  await upsertByFind(Certificate, { transactionId: transaction.id }, {
    transactionId: transaction.id,
    certificateNumber: `WTV-RW-${new Date().getFullYear()}-${100000 + transaction.id}`,
    materialType: materialByTitle["Plastic scraps"].title,
    quantityReused: "1500 kg",
    sellerCompanyName: companyByKey.industry.companyName,
    buyerCompanyName: companyByKey.buyer.companyName,
    transporterName: companyByKey.transporter.companyName,
    issueDate: new Date(),
    verificationStatus: "verified"
  });

  await upsertByFind(SustainabilityScore, { companyId: companyByKey.industry.id, month: new Date().getMonth() + 1, year: new Date().getFullYear() }, {
    companyId: companyByKey.industry.id,
    reuseRate: 88,
    completedTransactions: 12,
    totalWasteReused: 4600,
    listingQuality: 72,
    deliveryCompletion: 94,
    ratingScore: 86,
    finalScore: 86,
    level: "Gold",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const notifications = [
    { userId: userByKey.industry.id, title: "Material request approved", message: "Your plastic scraps listing was requested and approved by Eco Recycle Rwanda.", type: "request", isRead: true },
    { userId: userByKey.buyer.id, title: "Certificate generated", message: "Certificate for plastic scraps reuse is ready for verification.", type: "certificate", isRead: false },
    { userId: userByKey.transporter.id, title: "Delivery completed", message: "Delivery of plastic scraps to Muhima recycling yard was confirmed.", type: "delivery", isRead: false },
    { userId: userByKey.admin.id, title: "New waste listing submitted", message: "Packaging paper offcuts is waiting for admin approval.", type: "system", isRead: false },
    { userId: userByKey.regulator.id, title: "Waste diversion recorded", message: "1,500 kg of plastic scraps diverted from landfill and confirmed for reuse.", type: "system", isRead: false }
  ];
  for (const notification of notifications) {
    await upsertByFind(Notification, { userId: notification.userId, title: notification.title }, notification);
  }

  await upsertByFind(Review, { transactionId: transaction.id, reviewerCompanyId: companyByKey.buyer.id, reviewedCompanyId: companyByKey.transporter.id }, {
    reviewerCompanyId: companyByKey.buyer.id,
    reviewedCompanyId: companyByKey.transporter.id,
    transactionId: transaction.id,
    rating: 5,
    comment: "Delivery arrived on time and the material was handled carefully."
  });

  return {
    users: await User.count(),
    companies: await Company.count(),
    materials: await WasteMaterial.count(),
    requests: await MaterialRequest.count(),
    transportJobs: await TransportJob.count(),
    certificates: await Certificate.count()
  };
}

module.exports = { ensureDemoData };
