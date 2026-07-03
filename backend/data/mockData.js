const today = new Date().toISOString().slice(0, 10);

const users = [
  { id: 1, fullName: "Alain Fred NIYOGUSHIMWA", email: "admin@waste2value.rw", role: "admin", status: "active" },
  { id: 2, fullName: "Eric Nkurunziza", email: "industry@waste2value.rw", role: "industry", status: "active" },
  { id: 3, fullName: "Grace Mukamana", email: "buyer@waste2value.rw", role: "buyer", status: "active" },
  { id: 4, fullName: "Patrick Habimana", email: "transport@waste2value.rw", role: "transporter", status: "active" },
  { id: 5, fullName: "Divine Iradukunda", email: "regulator@waste2value.rw", role: "regulator", status: "active" }
];

const companies = [
  { id: 1, companyName: "COPED Group Rwanda", companyType: "waste_operator", district: "Gasabo", sector: "Kacyiru", verificationStatus: "verified", sustainabilityScore: 92 },
  { id: 2, companyName: "Kigali Plastics Ltd", companyType: "industry", district: "Kicukiro", sector: "Gikondo", verificationStatus: "verified", sustainabilityScore: 86 },
  { id: 3, companyName: "Eco Recycle Rwanda", companyType: "buyer", district: "Nyarugenge", sector: "Muhima", verificationStatus: "verified", sustainabilityScore: 82 },
  { id: 4, companyName: "GreenMove Logistics", companyType: "transporter", district: "Kicukiro", sector: "Gikondo", verificationStatus: "verified", sustainabilityScore: 79 },
  { id: 5, companyName: "Kigali Furniture Works", companyType: "industry", district: "Gasabo", sector: "Remera", verificationStatus: "pending", sustainabilityScore: 71 }
];

const categories = [
  { id: 1, name: "Plastic", description: "Plastic scraps, flakes, packaging and clean offcuts.", icon: "recycle", status: "active" },
  { id: 2, name: "Metal", description: "Metal offcuts, dust, and fabrication leftovers.", icon: "factory", status: "active" },
  { id: 3, name: "Wood", description: "Wood residues, sawdust and furniture offcuts.", icon: "package", status: "active" },
  { id: 4, name: "Paper", description: "Packaging paper, cartons and office paper.", icon: "file", status: "active" },
  { id: 5, name: "Textile", description: "Fabric leftovers and production remnants.", icon: "shirt", status: "active" },
  { id: 6, name: "Organic", description: "Reusable organic by-products.", icon: "leaf", status: "active" }
];

const materials = [
  {
    id: 1,
    title: "Plastic scraps",
    category: "Plastic",
    quantity: 2.4,
    unit: "tons",
    condition: "Clean, mixed, dry",
    price: "RWF 180/kg",
    district: "Kigali SEZ",
    sector: "Gikondo",
    seller: "Kigali Plastics Ltd",
    status: "available",
    match: 92,
    description: "Sorted plastic scraps from industrial packaging production.",
    pickupAddress: "Kigali Special Economic Zone",
    latitude: -1.969,
    longitude: 30.104
  },
  {
    id: 2,
    title: "Metal offcuts",
    category: "Metal",
    quantity: 700,
    unit: "kg",
    condition: "Clean fabrication offcuts",
    price: "Negotiable",
    district: "Gasabo",
    sector: "Kacyiru",
    seller: "Kigali Metal Works",
    status: "requested",
    match: 85,
    description: "Steel and aluminum offcuts suitable for local fabrication.",
    pickupAddress: "Kacyiru service yard",
    latitude: -1.939,
    longitude: 30.092
  },
  {
    id: 3,
    title: "Wood residues",
    category: "Wood",
    quantity: 1.2,
    unit: "tons",
    condition: "Dry sawdust and offcuts",
    price: "RWF 60/kg",
    district: "Gasabo",
    sector: "Remera",
    seller: "Kigali Furniture Works",
    status: "available",
    match: 89,
    description: "Furniture production residue ready for briquette processing.",
    pickupAddress: "Remera production workshop",
    latitude: -1.956,
    longitude: 30.113
  },
  {
    id: 4,
    title: "Textile leftovers",
    category: "Textile",
    quantity: 450,
    unit: "kg",
    condition: "Mixed clean fabric",
    price: "Free pickup",
    district: "Nyarugenge",
    sector: "Nyamirambo",
    seller: "Kigali Stitch Co.",
    status: "available",
    match: 76,
    description: "Clean textile leftovers for crafts, insulation or padding.",
    pickupAddress: "Nyamirambo tailoring workshop",
    latitude: -1.984,
    longitude: 30.044
  }
];

const materialRequests = [
  { id: 1, material: "Plastic scraps", buyer: "Eco Recycle Rwanda", seller: "Kigali Plastics Ltd", quantity: "1.5 tons", status: "approved", offeredPrice: "RWF 270,000" },
  { id: 2, material: "Metal offcuts", buyer: "FabLab SME", seller: "Kigali Metal Works", quantity: "500 kg", status: "pending", offeredPrice: "Negotiable" },
  { id: 3, material: "Wood residues", buyer: "Briquette Co.", seller: "Kigali Furniture Works", quantity: "1.2 tons", status: "negotiating", offeredPrice: "RWF 72,000" }
];

const transactions = [
  { id: 1, material: "Plastic scraps", seller: "Kigali Plastics", buyer: "Eco Recycle", transport: "Assigned", status: "Delivered", certificate: "Generated", totalAmount: "RWF 432,000" },
  { id: 2, material: "Metal offcuts", seller: "Kigali Metal Works", buyer: "FabLab SME", transport: "Pending", status: "Paid", certificate: "Waiting", totalAmount: "RWF 210,000" },
  { id: 3, material: "Wood residues", seller: "Kigali Furniture Works", buyer: "Briquette Co.", transport: "Assigned", status: "In transit", certificate: "Waiting", totalAmount: "RWF 72,000" }
];

const transportJobs = [
  { id: 1, material: "Plastic scraps", route: "Kigali SEZ -> Gikondo", quantity: "2.4 tons", status: "available", offer: "RWF 42,000" },
  { id: 2, material: "Metal offcuts", route: "Kacyiru -> Muhima", quantity: "700 kg", status: "view", offer: "RWF 35,000" },
  { id: 3, material: "Wood residue", route: "Remera -> Gisozi", quantity: "1.2 tons", status: "available", offer: "RWF 28,000" }
];

const certificates = [
  {
    id: 1,
    certificateNumber: "W2V-RW-2026-000184",
    materialType: "Plastic scraps",
    quantityReused: "2.4 tons",
    sellerCompanyName: "Kigali Plastics Ltd",
    buyerCompanyName: "Eco Recycle Rwanda",
    transporterName: "GreenMove Logistics",
    deliveryStatus: "Verified and completed",
    issueDate: "11 June 2026",
    verificationStatus: "verified",
    environmentalImpact: "4.1 tons landfill diversion estimate"
  },
  {
    id: 2,
    certificateNumber: "W2V-RW-2026-000185",
    materialType: "Wood residues",
    quantityReused: "1.2 tons",
    sellerCompanyName: "Kigali Furniture Works",
    buyerCompanyName: "Briquette Co.",
    transporterName: "GreenMove Logistics",
    deliveryStatus: "In transit",
    issueDate: "Pending",
    verificationStatus: "pending",
    environmentalImpact: "1.8 tons landfill diversion estimate"
  }
];

const notifications = [
  { id: 1, title: "New material match", message: "Plastic scraps near Kigali match your buyer preferences.", type: "match", isRead: false },
  { id: 2, title: "Certificate generated", message: "Certificate W2V-RW-2026-000184 is ready for download.", type: "certificate", isRead: false },
  { id: 3, title: "Delivery update", message: "GreenMove Logistics marked plastic scraps as delivered.", type: "delivery", isRead: true }
];

const dashboard = {
  admin: {
    stats: [
      { label: "Registered companies", value: "248", detail: "+18 this month", tone: "green" },
      { label: "Listed materials", value: "1,924", detail: "plastic, metal, wood", tone: "blue" },
      { label: "Transactions", value: "756", detail: "completed exchanges", tone: "orange" },
      { label: "Waste diverted", value: "128 tons", detail: "from landfill", tone: "green" }
    ],
    activity: [
      { label: "Mon", value: 44 },
      { label: "Tue", value: 64 },
      { label: "Wed", value: 37 },
      { label: "Thu", value: 78 },
      { label: "Fri", value: 56 },
      { label: "Sat", value: 92 },
      { label: "Sun", value: 71 }
    ],
    approvals: [
      { id: 1, title: "New waste producer verification", priority: "Review", status: "pending" },
      { id: 2, title: "Transport provider license", priority: "Review", status: "pending" },
      { id: 3, title: "Material quality report", priority: "Review", status: "pending" },
      { id: 4, title: "COPED recovery report export", priority: "Review", status: "pending" }
    ]
  },
  industry: {
    stats: [
      { label: "My listed waste", value: "36", detail: "8 available now", tone: "green" },
      { label: "Monthly disposal saved", value: "RWF 420k", detail: "estimated cost saved", tone: "blue" },
      { label: "Revenue from waste", value: "RWF 1.8M", detail: "this quarter", tone: "orange" },
      { label: "Sustainability score", value: "86/100", detail: "Gold level", tone: "green" }
    ],
    listings: [
      "Plastic scraps - 2.4 tons - Available",
      "Packaging paper - 600 kg - Requested",
      "Metal dust - 300 kg - Under review",
      "Wood residue - 1.1 tons - Available"
    ],
    scoreBreakdown: [
      { label: "Reuse rate", value: 88 },
      { label: "Quality uploads", value: 72 },
      { label: "Delivery completion", value: 94 },
      { label: "Certificate history", value: 86 }
    ]
  },
  buyer: {
    stats: [
      { label: "Matched materials", value: "24", detail: "based on needs", tone: "green" },
      { label: "Saved cost", value: "RWF 310k", detail: "vs normal supply", tone: "blue" },
      { label: "Active requests", value: "7", detail: "awaiting supplier", tone: "orange" },
      { label: "Certificates received", value: "18", detail: "reuse proof", tone: "green" }
    ],
    preferences: ["Plastic", "Metal", "Paper", "Wood", "Textile", "Organic"],
    recommendation: "Based on previous purchases, the system recommends 1.5-2 tons of clean plastic scrap from Kigali SEZ this week."
  },
  transporter: {
    stats: [
      { label: "Available jobs", value: "12", detail: "near your location", tone: "green" },
      { label: "In transit", value: "4", detail: "active deliveries", tone: "blue" },
      { label: "Completed", value: "96", detail: "total jobs", tone: "orange" },
      { label: "Rating", value: "4.7/5", detail: "from companies", tone: "green" }
    ],
    routeSuggestion: "System suggests combining two nearby pickup jobs to reduce fuel cost and delivery time."
  },
  regulator: {
    stats: [
      { label: "Waste diverted", value: "128 tons", detail: "verified this year", tone: "green" },
      { label: "CO2 estimate saved", value: "84 tons", detail: "platform estimate", tone: "blue" },
      { label: "Certified exchanges", value: "512", detail: "digital proof", tone: "orange" },
      { label: "Risk reports", value: "9", detail: "needs inspection", tone: "red" }
    ],
    impact: [
      { label: "Plastic", value: 40 },
      { label: "Metal", value: 25 },
      { label: "Wood", value: 18 },
      { label: "Paper", value: 10 },
      { label: "Textile", value: 7 }
    ],
    alerts: [
      { title: "Incomplete material quality data", level: "Medium" },
      { title: "Repeated cancelled deliveries", level: "Low" },
      { title: "High-risk hazardous category", level: "High" },
      { title: "Certificate verification request", level: "Medium" }
    ]
  },
  analytics: {
    stats: [
      { label: "Predicted supply", value: "34 tons", detail: "next 30 days", tone: "green" },
      { label: "Predicted demand", value: "29 tons", detail: "next 30 days", tone: "blue" },
      { label: "Best material", value: "Plastic", detail: "highest demand", tone: "orange" },
      { label: "Optimization saving", value: "18%", detail: "transport cost", tone: "green" }
    ],
    forecast: [
      { label: "Jul", value: 16 },
      { label: "Aug", value: 29 },
      { label: "Sep", value: 38 },
      { label: "Oct", value: 32 },
      { label: "Nov", value: 49 },
      { label: "Dec", value: 58 }
    ],
    recommendations: [
      "Plastic demand is increasing around Kigali. Keep stock visible and update quantity weekly.",
      "Combine nearby deliveries from SEZ to reduce transport cost.",
      "Industry score can improve by uploading better material photos and quality details.",
      "Buyer should reserve metal scraps early because demand may rise next month."
    ]
  }
};

module.exports = {
  today,
  users,
  companies,
  categories,
  materials,
  materialRequests,
  transactions,
  transportJobs,
  certificates,
  notifications,
  dashboard
};
