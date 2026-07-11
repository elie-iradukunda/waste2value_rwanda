const bcrypt = require("bcryptjs");
require("dotenv").config();
const {
  sequelize,
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
} = require("./models");

async function seed() {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
  console.log("Database reset. Seeding Waste-to-Value Rwanda demo data...");

  const passwordHash = await bcrypt.hash("demo123", 10);

  const categories = await MaterialCategory.bulkCreate([
    { name: "Plastic", description: "Plastic scraps, flakes, packaging and clean offcuts.", icon: "recycle" },
    { name: "Metal", description: "Metal offcuts, dust and fabrication leftovers.", icon: "factory" },
    { name: "Wood", description: "Wood residues, sawdust and furniture offcuts.", icon: "package" },
    { name: "Paper", description: "Packaging paper, cartons and office paper.", icon: "file" },
    { name: "Textile", description: "Fabric leftovers and production remnants.", icon: "shirt" },
    { name: "Organic", description: "Reusable organic by-products.", icon: "leaf" }
  ]);
  const categoryByName = Object.fromEntries(categories.map((category) => [category.name, category]));

  const users = {
    admin: await User.create({ fullName: "Alain Fred NIYOGUSHIMWA", email: "admin@wastetovalue.rw", phone: "0788000001", password: passwordHash, role: "admin", status: "active" }),
    industry: await User.create({ fullName: "Eric Nkurunziza", email: "industry@wastetovalue.rw", phone: "0788000002", password: passwordHash, role: "industry", status: "active" }),
    industry2: await User.create({ fullName: "Claudine Uwase", email: "industry2@wastetovalue.rw", phone: "0788000006", password: passwordHash, role: "industry", status: "active" }),
    buyer: await User.create({ fullName: "Grace Mukamana", email: "buyer@wastetovalue.rw", phone: "0788000003", password: passwordHash, role: "buyer", status: "active" }),
    buyer2: await User.create({ fullName: "Jean Bosco Habimana", email: "buyer2@wastetovalue.rw", phone: "0788000007", password: passwordHash, role: "buyer", status: "active" }),
    transporter: await User.create({ fullName: "Patrick Habimana", email: "transport@wastetovalue.rw", phone: "0788000004", password: passwordHash, role: "transporter", status: "active" }),
    regulator: await User.create({ fullName: "Divine Iradukunda", email: "regulator@wastetovalue.rw", phone: "0788000005", password: passwordHash, role: "regulator", status: "active" })
  };

  const companies = {
    admin: await Company.create({ userId: users.admin.id, companyName: "Waste-to-Value Rwanda", companyType: "admin", district: "Gasabo", sector: "Kacyiru", verificationStatus: "verified", sustainabilityScore: 100, email: users.admin.email }),
    industry: await Company.create({ userId: users.industry.id, companyName: "Kigali Plastics Ltd", companyType: "industry", district: "Kicukiro", sector: "Gikondo", address: "Kigali Special Economic Zone", verificationStatus: "verified", sustainabilityScore: 86, email: users.industry.email }),
    industry2: await Company.create({ userId: users.industry2.id, companyName: "Kigali Furniture Works", companyType: "industry", district: "Gasabo", sector: "Remera", address: "Remera production workshop", verificationStatus: "pending", sustainabilityScore: 71, email: users.industry2.email }),
    buyer: await Company.create({ userId: users.buyer.id, companyName: "Eco Recycle Rwanda", companyType: "buyer", district: "Nyarugenge", sector: "Muhima", address: "Muhima recycling yard", verificationStatus: "verified", sustainabilityScore: 82, email: users.buyer.email }),
    buyer2: await Company.create({ userId: users.buyer2.id, companyName: "FabLab SME", companyType: "buyer", district: "Nyarugenge", sector: "Nyamirambo", address: "Nyamirambo workshop", verificationStatus: "verified", sustainabilityScore: 68, email: users.buyer2.email }),
    transporter: await Company.create({ userId: users.transporter.id, companyName: "GreenMove Logistics", companyType: "transporter", district: "Kicukiro", sector: "Gikondo", address: "Gikondo depot", verificationStatus: "verified", sustainabilityScore: 79, email: users.transporter.email }),
    regulator: await Company.create({ userId: users.regulator.id, companyName: "COPED Group Rwanda", companyType: "regulator", district: "Gasabo", sector: "Kacyiru", address: "Utexrwa Road, KG 15 Avenue, Kacyiru", verificationStatus: "verified", sustainabilityScore: 92, email: users.regulator.email })
  };

  const materials = await WasteMaterial.bulkCreate([
    { companyId: companies.industry.id, categoryId: categoryByName.Plastic.id, title: "Plastic scraps", description: "Sorted plastic scraps from industrial packaging production.", quantity: 2400, unit: "kg", condition: "Clean, mixed, dry", price: 180, district: "Kicukiro", sector: "Gikondo", pickupAddress: "Kigali Special Economic Zone", latitude: -1.969, longitude: 30.104, status: "available" },
    { companyId: companies.industry.id, categoryId: categoryByName.Metal.id, title: "Metal offcuts", description: "Steel and aluminum offcuts suitable for local fabrication.", quantity: 700, unit: "kg", condition: "Clean fabrication offcuts", price: 0, district: "Kicukiro", sector: "Gikondo", pickupAddress: "Gikondo fabrication yard", latitude: -1.966, longitude: 30.106, status: "available" },
    { companyId: companies.industry2.id, categoryId: categoryByName.Wood.id, title: "Wood residues", description: "Furniture production residue ready for briquette processing.", quantity: 1200, unit: "kg", condition: "Dry sawdust and offcuts", price: 60, district: "Gasabo", sector: "Remera", pickupAddress: "Remera production workshop", latitude: -1.956, longitude: 30.113, status: "available" },
    { companyId: companies.industry2.id, categoryId: categoryByName.Textile.id, title: "Textile leftovers", description: "Clean textile leftovers for crafts, insulation or padding.", quantity: 450, unit: "kg", condition: "Mixed clean fabric", price: 0, isFree: true, district: "Nyarugenge", sector: "Nyamirambo", pickupAddress: "Nyamirambo tailoring workshop", latitude: -1.984, longitude: 30.044, status: "available" },
    { companyId: companies.industry.id, categoryId: categoryByName.Paper.id, title: "Packaging paper offcuts", description: "Clean cardboard and packaging paper offcuts from production.", quantity: 600, unit: "kg", condition: "Clean, dry", price: 40, district: "Kicukiro", sector: "Gikondo", pickupAddress: "Kigali Special Economic Zone", status: "pending_review" },
    { companyId: companies.industry2.id, categoryId: categoryByName.Organic.id, title: "Organic sawmill residue", description: "Organic residue from wood processing, suitable for composting.", quantity: 900, unit: "kg", condition: "Fresh, mixed", price: 0, isFree: true, district: "Gasabo", sector: "Remera", pickupAddress: "Remera production workshop", status: "pending_review" }
  ]);

  const [plasticScraps, metalOffcuts, woodResidues] = materials;

  const requests = await MaterialRequest.bulkCreate([
    { materialId: plasticScraps.id, buyerCompanyId: companies.buyer.id, sellerCompanyId: companies.industry.id, requestedQuantity: 1500, message: "Interested in 1.5 tons of clean plastic scraps for recycling.", offeredPrice: 270000, status: "approved" },
    { materialId: metalOffcuts.id, buyerCompanyId: companies.buyer2.id, sellerCompanyId: companies.industry.id, requestedQuantity: 500, message: "FabLab SME needs metal offcuts for fabrication training.", status: "pending" },
    { materialId: woodResidues.id, buyerCompanyId: companies.buyer.id, sellerCompanyId: companies.industry2.id, requestedQuantity: 1200, offeredPrice: 72000, message: "Requesting wood residue for briquette production.", status: "negotiating" }
  ]);

  const approvedRequest = requests[0];
  plasticScraps.status = "reserved";
  await plasticScraps.save();

  const transaction = await Transaction.create({
    requestId: approvedRequest.id,
    materialId: plasticScraps.id,
    buyerCompanyId: companies.buyer.id,
    sellerCompanyId: companies.industry.id,
    quantity: 1500,
    totalAmount: 270000,
    paymentStatus: "paid",
    transactionStatus: "delivered"
  });

  const transportJob = await TransportJob.create({
    transactionId: transaction.id,
    transporterCompanyId: companies.transporter.id,
    pickupLocation: "Kigali Special Economic Zone",
    deliveryLocation: "Muhima recycling yard",
    pickupDate: new Date(),
    transportCost: 42000,
    status: "delivered"
  });

  await Certificate.create({
    transactionId: transaction.id,
    certificateNumber: `WTV-RW-${new Date().getFullYear()}-${100000 + transaction.id}`,
    materialType: plasticScraps.title,
    quantityReused: "1500 kg",
    sellerCompanyName: companies.industry.companyName,
    buyerCompanyName: companies.buyer.companyName,
    transporterName: companies.transporter.companyName,
    issueDate: new Date(),
    verificationStatus: "verified"
  });

  await SustainabilityScore.create({
    companyId: companies.industry.id,
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

  await Notification.bulkCreate([
    { userId: users.industry.id, title: "Material request approved", message: "Your plastic scraps listing was requested and approved by Eco Recycle Rwanda.", type: "request", isRead: true },
    { userId: users.buyer.id, title: "Certificate generated", message: `Certificate for plastic scraps reuse is ready for verification.`, type: "certificate", isRead: false },
    { userId: users.transporter.id, title: "Delivery completed", message: "Delivery of plastic scraps to Muhima recycling yard was confirmed.", type: "delivery", isRead: false },
    { userId: users.admin.id, title: "New waste listing submitted", message: "Packaging paper offcuts is waiting for admin approval.", type: "system", isRead: false },
    { userId: users.regulator.id, title: "Waste diversion recorded", message: "1,500 kg of plastic scraps diverted from landfill and confirmed for reuse.", type: "system", isRead: false }
  ]);

  await Review.create({
    reviewerCompanyId: companies.buyer.id,
    reviewedCompanyId: companies.transporter.id,
    transactionId: transaction.id,
    rating: 5,
    comment: "Delivery arrived on time and the material was handled carefully."
  });

  console.log("Seed complete.");
  console.log("Demo accounts (all use password: demo123):");
  Object.values(users).forEach((user) => console.log(`  ${user.role.padEnd(12)} ${user.email}`));

  await sequelize.close();
}

seed().catch((error) => {
  console.error("Seeding failed", error);
  process.exit(1);
});
