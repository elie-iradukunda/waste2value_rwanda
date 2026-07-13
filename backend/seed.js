const bcrypt = require("bcryptjs");
require("dotenv").config();
const { sequelize, Company, User, Category, WasteListing, WasteRequest, TransportJob, Certificate, Transaction } = require("./models");

const DEMO_PASSWORD = "password123";

function materialImage(label, color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 540">
      <rect width="900" height="540" fill="#101827"/>
      <rect x="48" y="48" width="804" height="444" rx="36" fill="${color}" opacity="0.18"/>
      <circle cx="694" cy="164" r="96" fill="${color}" opacity="0.48"/>
      <path d="M128 412c90-120 156-144 250-66 72 60 130 68 212 6 72-54 128-58 222 26v114H128z" fill="${color}" opacity="0.7"/>
      <text x="86" y="118" fill="#f8fafc" font-family="Arial, sans-serif" font-size="42" font-weight="700">${label}</text>
      <text x="88" y="172" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="24">Waste to Value material photo</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function materialMedia(label, color) {
  const gallery = [
    materialImage(label, color),
    materialImage(`${label} - Sorted`, color),
    materialImage(`${label} - Packed`, color)
  ];
  return { imageDataUrl: gallery[0], imageGallery: gallery };
}

async function seed() {
  await sequelize.authenticate();
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  await sequelize.sync({ force: true });
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log("Database reset. Seeding Waste to Value demo data...");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const categories = await Category.bulkCreate([
    { name: "Plastic" },
    { name: "Metal" },
    { name: "Paper" },
    { name: "Organic Waste" },
    { name: "Glass" },
    { name: "Electronics" }
  ]);
  const cat = Object.fromEntries(categories.map((category) => [category.name, category]));

  const producerCo = await Company.create({
    name: "Kigali Plastics Ltd",
    type: "PRODUCER",
    contactEmail: "industry@wastetovalue.rw",
    phone: "0788000002",
    status: "APPROVED",
    registrationNumber: "RDB-102938-KPL",
    businessLocation: "Gikondo, Kigali",
    producedMaterials: "Plastic packaging, PET bottles, HDPE containers, industrial plastic offcuts",
    productionDescription: "Manufactures and sorts plastic packaging products that generate reusable plastic scraps and clean production offcuts.",
    rdbDocumentName: "Kigali Plastics RDB certificate.png",
    rdbDocumentDataUrl: materialImage("RDB Certificate", "#059669")
  });
  const recyclerCo = await Company.create({ name: "Eco Recycle Rwanda", type: "RECYCLER", contactEmail: "buyer@wastetovalue.rw", phone: "0788000003", status: "APPROVED" });

  await Company.create({
    name: "Kigali Furniture Works",
    type: "PRODUCER",
    contactEmail: "info@kfw.rw",
    phone: "0788000010",
    status: "PENDING",
    registrationNumber: "RDB-774411-KFW",
    businessLocation: "Kimironko, Kigali",
    producedMaterials: "Wood furniture, cardboard packaging, sawdust, textile offcuts",
    productionDescription: "Furniture workshop requesting producer approval to list reusable wood, packaging, and sawdust waste streams.",
    rdbDocumentName: "Kigali Furniture Works RDB certificate.png",
    rdbDocumentDataUrl: materialImage("RDB Certificate", "#d97706")
  });

  const admin = await User.create({ name: "Alain Fred NIYOGUSHIMWA", email: "admin@wastetovalue.rw", passwordHash, role: "ADMIN", companyId: null });
  const producer = await User.create({ name: "Eric Nkurunziza", email: "industry@wastetovalue.rw", passwordHash, role: "PRODUCER", companyId: producerCo.id });
  const recyclerUser = await User.create({ name: "Grace Mukamana", email: "buyer@wastetovalue.rw", passwordHash, role: "RECYCLER", companyId: recyclerCo.id });
  const transportUser = await User.create({ name: "Patrick Habimana", email: "transport@wastetovalue.rw", passwordHash, role: "TRANSPORT", companyId: producerCo.id });

  const plasticScraps = await WasteListing.create({
    title: "Plastic Scraps",
    description: "Sorted plastic scraps from industrial packaging production.",
    ...materialMedia("Plastic Scraps", "#2563eb"),
    quantity: 2400,
    unit: "KG",
    priceAmount: 120,
    currency: "RWF",
    priceType: "PER_UNIT",
    location: "Gikondo, Kigali",
    status: "APPROVED",
    quality: "A",
    categoryId: cat.Plastic.id,
    producerCompanyId: producerCo.id,
    createdById: producer.id
  });
  const metalOffcuts = await WasteListing.create({
    title: "Metal Offcuts",
    description: "Steel and aluminum offcuts suitable for local fabrication.",
    ...materialMedia("Metal Offcuts", "#64748b"),
    quantity: 700,
    unit: "KG",
    priceAmount: 650,
    currency: "RWF",
    priceType: "PER_UNIT",
    location: "Gikondo, Kigali",
    status: "APPROVED",
    quality: "B",
    categoryId: cat.Metal.id,
    producerCompanyId: producerCo.id,
    createdById: producer.id
  });
  await WasteListing.create({
    title: "Packaging Paper Offcuts",
    description: "Clean cardboard and packaging paper offcuts from production.",
    ...materialMedia("Paper Offcuts", "#d97706"),
    quantity: 600,
    unit: "KG",
    priceAmount: 80,
    currency: "RWF",
    priceType: "PER_UNIT",
    location: "Kigali Special Economic Zone",
    status: "PENDING_APPROVAL",
    categoryId: cat.Paper.id,
    producerCompanyId: producerCo.id,
    createdById: producer.id
  });
  const cartons = await WasteListing.create({
    title: "Cartons and Boxes",
    description: "Used cartons and boxes, folded and ready for pickup.",
    ...materialMedia("Cartons and Boxes", "#ca8a04"),
    quantity: 800,
    unit: "KG",
    priceAmount: 60000,
    currency: "RWF",
    priceType: "TOTAL",
    location: "Kimironko, Kigali",
    status: "MATCHED",
    categoryId: cat.Paper.id,
    producerCompanyId: producerCo.id,
    createdById: producer.id
  });
  const aluminumCans = await WasteListing.create({
    title: "Aluminum Cans",
    description: "Crushed aluminum cans, sorted and bagged.",
    ...materialMedia("Aluminum Cans", "#475569"),
    quantity: 300,
    unit: "KG",
    priceAmount: 900,
    currency: "RWF",
    priceType: "PER_UNIT",
    location: "Nyabugogo, Kigali",
    status: "IN_TRANSIT",
    categoryId: cat.Metal.id,
    producerCompanyId: producerCo.id,
    createdById: producer.id
  });
  const compost = await WasteListing.create({
    title: "Organic Compost Waste",
    description: "Organic residue suitable for composting.",
    ...materialMedia("Organic Compost", "#059669"),
    quantity: 1200,
    unit: "KG",
    priceAmount: 45,
    currency: "RWF",
    priceType: "PER_UNIT",
    location: "Kicukiro, Kigali",
    status: "DELIVERED",
    categoryId: cat["Organic Waste"].id,
    producerCompanyId: producerCo.id,
    createdById: producer.id
  });
  const glassBottles = await WasteListing.create({
    title: "Glass Bottles",
    description: "Clean glass bottles, sorted by color.",
    ...materialMedia("Glass Bottles", "#0891b2"),
    quantity: 500,
    unit: "KG",
    priceAmount: 150,
    currency: "RWF",
    priceType: "PER_UNIT",
    location: "Remera, Kigali",
    status: "CERTIFIED",
    categoryId: cat.Glass.id,
    producerCompanyId: producerCo.id,
    createdById: producer.id
  });

  await WasteRequest.create({ listingId: metalOffcuts.id, recyclerCompanyId: recyclerCo.id, createdById: recyclerUser.id, requestedQuantity: 450, requestedUnit: "KG", proposedPrice: 650, contactName: "Grace Mukamana", contactPhone: "0788000003", preferredPickupDate: new Date(), deliveryLocation: "Eco Recycle Rwanda workshop, Muhima", message: "We would like to collect this for our workshop.", status: "PENDING" });
  await WasteRequest.create({ listingId: cartons.id, recyclerCompanyId: recyclerCo.id, createdById: recyclerUser.id, requestedQuantity: 800, requestedUnit: "KG", proposedPrice: 60000, contactName: "Grace Mukamana", contactPhone: "0788000003", preferredPickupDate: new Date(), deliveryLocation: "Eco Recycle Rwanda workshop, Muhima", status: "APPROVED", decisionReason: "Approved because the recycler can collect this material within the requested pickup window." });
  await WasteRequest.create({ listingId: aluminumCans.id, recyclerCompanyId: recyclerCo.id, createdById: recyclerUser.id, requestedQuantity: 300, requestedUnit: "KG", proposedPrice: 900, contactName: "Grace Mukamana", contactPhone: "0788000003", preferredPickupDate: new Date(), deliveryLocation: "Eco Recycle Rwanda workshop, Muhima", status: "APPROVED", decisionReason: "Approved because the recycler profile matches metal reuse requirements." });
  await WasteRequest.create({ listingId: compost.id, recyclerCompanyId: recyclerCo.id, createdById: recyclerUser.id, requestedQuantity: 1200, requestedUnit: "KG", proposedPrice: 45, contactName: "Grace Mukamana", contactPhone: "0788000003", preferredPickupDate: new Date(), deliveryLocation: "Eco Recycle Rwanda composting site", status: "APPROVED", decisionReason: "Approved for compost processing and delivery confirmation." });
  await WasteRequest.create({ listingId: glassBottles.id, recyclerCompanyId: recyclerCo.id, createdById: recyclerUser.id, requestedQuantity: 500, requestedUnit: "KG", proposedPrice: 150, contactName: "Grace Mukamana", contactPhone: "0788000003", preferredPickupDate: new Date(), deliveryLocation: "Eco Recycle Rwanda glass sorting site", status: "APPROVED", decisionReason: "Approved after checking recycler capacity and collection readiness." });

  await TransportJob.create({ listingId: cartons.id, status: "WAITING", pickupLocation: cartons.location, dropoffLocation: "Eco Recycle Rwanda workshop, Muhima", providerCompanyId: producerCo.id });
  await TransportJob.create({
    listingId: aluminumCans.id,
    status: "IN_TRANSIT",
    pickupLocation: aluminumCans.location,
    dropoffLocation: "Eco Recycle Rwanda workshop, Muhima",
    providerCompanyId: producerCo.id,
    handledById: transportUser.id,
    driverName: "Patrick Habimana",
    driverPhone: "0788000004",
    vehiclePlate: "RAB 245 G",
    pickupQuantity: aluminumCans.quantity,
    pickupUnit: aluminumCans.unit,
    pickupCondition: "GOOD",
    pickupNotes: "Bags counted and loaded from Nyabugogo collection point.",
    pickedUpAt: new Date()
  });
  await TransportJob.create({
    listingId: compost.id,
    status: "DELIVERED",
    pickupLocation: compost.location,
    dropoffLocation: "Eco Recycle Rwanda compost bay",
    providerCompanyId: producerCo.id,
    handledById: transportUser.id,
    driverName: "Patrick Habimana",
    driverPhone: "0788000004",
    vehiclePlate: "RAC 831 P",
    pickupQuantity: compost.quantity,
    pickupUnit: compost.unit,
    pickupCondition: "GOOD",
    pickupNotes: "Organic residue loaded in sealed sacks.",
    deliveryQuantity: compost.quantity,
    deliveryUnit: compost.unit,
    deliveryCondition: "GOOD",
    deliveryLocation: "Eco Recycle Rwanda compost bay",
    receiverName: "Grace Mukamana",
    receiverPhone: "0788000003",
    deliveryNotes: "Delivered without quantity mismatch.",
    pickedUpAt: new Date(),
    deliveredAt: new Date()
  });
  await TransportJob.create({
    listingId: glassBottles.id,
    status: "DELIVERED",
    pickupLocation: glassBottles.location,
    dropoffLocation: "Eco Recycle Rwanda glass sorting line",
    providerCompanyId: producerCo.id,
    handledById: transportUser.id,
    driverName: "Patrick Habimana",
    driverPhone: "0788000004",
    vehiclePlate: "RAD 114 K",
    pickupQuantity: glassBottles.quantity,
    pickupUnit: glassBottles.unit,
    pickupCondition: "GOOD",
    pickupNotes: "Crates checked before loading.",
    deliveryQuantity: glassBottles.quantity,
    deliveryUnit: glassBottles.unit,
    deliveryCondition: "GOOD",
    deliveryLocation: "Eco Recycle Rwanda glass sorting line",
    receiverName: "Grace Mukamana",
    receiverPhone: "0788000003",
    deliveryNotes: "Received for color sorting.",
    pickedUpAt: new Date(),
    deliveredAt: new Date()
  });

  await Certificate.create({
    id: `WTV-CERT-${new Date().getFullYear()}-1001`,
    listingId: glassBottles.id,
    quantity: glassBottles.quantity,
    unit: glassBottles.unit,
    category: cat.Glass.name,
    receiptCondition: "GOOD",
    receiverName: "Grace Mukamana",
    receiverPhone: "0788000003",
    receiptLocation: "Eco Recycle Rwanda glass sorting site",
    receiptNotes: "Material received, checked, and approved for recycling certification.",
    receiptConfirmedAt: new Date(),
    producerCompanyId: producerCo.id,
    recyclerCompanyId: recyclerCo.id
  });

  await Transaction.bulkCreate([
    { type: "LISTING_APPROVED", message: "Plastic Scraps approved (quality A)", actorId: admin.id, listingId: plasticScraps.id },
    { type: "REQUEST_MATCHED", message: "Cartons and Boxes matched with a buyer - transport job created", actorId: producer.id, listingId: cartons.id },
    { type: "DELIVERED", message: "Organic Compost Waste delivered to buyer - awaiting confirmation", actorId: transportUser.id, listingId: compost.id },
    { type: "CERTIFIED", message: `Glass Bottles (${glassBottles.quantity}${glassBottles.unit}) received - certificate WTV-CERT-${new Date().getFullYear()}-1001 issued`, actorId: recyclerUser.id, listingId: glassBottles.id }
  ]);

  console.log("Seed complete.");
  console.log("Demo accounts (all use password: " + DEMO_PASSWORD + "):");
  console.log("  ADMIN      admin@wastetovalue.rw");
  console.log("  PRODUCER   industry@wastetovalue.rw");
  console.log("  RECYCLER   buyer@wastetovalue.rw");
  console.log("  TRANSPORT STAFF  transport@wastetovalue.rw");

  await sequelize.close();
}

seed().catch((error) => {
  console.error("Seeding failed", error);
  process.exit(1);
});
