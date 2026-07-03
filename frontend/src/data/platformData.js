export const roleMeta = {
  admin: { label: "Admin", basePath: "/admin" },
  industry: { label: "Waste Producer", basePath: "/industry" },
  buyer: { label: "Recycler / SME", basePath: "/buyer" },
  transporter: { label: "Transport Provider", basePath: "/transport" },
  regulator: { label: "COPED / Waste Operator", basePath: "/regulator" }
};

export const navItems = [
  "Dashboard",
  "Materials",
  "Marketplace",
  "Requests",
  "Transport",
  "Certificates",
  "Analytics",
  "Messages",
  "Settings"
];

export const publicStats = [
  { label: "Kg diverted today", value: "1,260+" },
  { label: "Active companies", value: "48" },
  { label: "Completed exchanges", value: "32" },
  { label: "Reuse success", value: "84%" }
];

export const materials = [
  {
    id: 1,
    title: "Plastic scraps",
    category: "Plastic",
    quantity: "2.4 tons",
    location: "Kigali SEZ",
    district: "Gasabo",
    price: "RWF 180/kg",
    seller: "Kigali Plastics Ltd",
    status: "Available",
    match: 92,
    condition: "Clean, mixed, dry",
    description: "Sorted plastic scraps from packaging production, ready for recycling or manufacturing reuse."
  },
  {
    id: 2,
    title: "Metal offcuts",
    category: "Metal",
    quantity: "700 kg",
    location: "Kacyiru",
    district: "Gasabo",
    price: "Negotiable",
    seller: "Kigali Metal Works",
    status: "Requested",
    match: 85,
    condition: "Clean fabrication offcuts",
    description: "Reusable metal pieces suitable for fabrication, artisan work, school labs or repair workshops."
  },
  {
    id: 3,
    title: "Wood residues",
    category: "Wood",
    quantity: "1.2 tons",
    location: "Remera",
    district: "Gasabo",
    price: "RWF 60/kg",
    seller: "Kigali Furniture Works",
    status: "Available",
    match: 89,
    condition: "Dry sawdust and offcuts",
    description: "Dry wood residue from furniture production, suitable for briquettes or composite panels."
  },
  {
    id: 4,
    title: "Textile leftovers",
    category: "Textile",
    quantity: "450 kg",
    location: "Nyamirambo",
    district: "Nyarugenge",
    price: "Free pickup",
    seller: "Kigali Stitch Co.",
    status: "Available",
    match: 76,
    condition: "Clean fabric pieces",
    description: "Mixed clean fabric pieces for crafts, padding, insulation, training centers or SMEs."
  }
];

export const transactions = [
  { material: "Plastic scraps", seller: "Kigali Plastics", buyer: "Eco Recycle", transport: "Assigned", status: "Delivered", certificate: "Generated" },
  { material: "Metal offcuts", seller: "Kigali Metal Works", buyer: "FabLab SME", transport: "Pending", status: "Paid", certificate: "Waiting" },
  { material: "Wood residues", seller: "Kigali Furniture Works", buyer: "Briquette Co.", transport: "Assigned", status: "In transit", certificate: "Waiting" }
];

export const transportJobs = [
  { title: "Plastic scraps", meta: "Kigali SEZ -> Gikondo - 2.4 tons", action: "Accept", tone: "green" },
  { title: "Metal offcuts", meta: "Kacyiru -> Muhima - 700 kg", action: "View", tone: "blue" },
  { title: "Wood residue", meta: "Remera -> Gisozi - 1.2 tons", action: "Accept", tone: "green" }
];

export const certificates = [
  {
    certificateNumber: "W2V-RW-2026-000184",
    materialType: "Plastic scraps",
    quantityReused: "2.4 tons",
    sellerCompanyName: "Kigali Plastics Ltd",
    buyerCompanyName: "Eco Recycle Rwanda",
    transporterName: "GreenMove Logistics",
    deliveryStatus: "Verified and completed",
    issueDate: "11 June 2026"
  },
  {
    certificateNumber: "W2V-RW-2026-000185",
    materialType: "Wood residues",
    quantityReused: "1.2 tons",
    sellerCompanyName: "Kigali Furniture Works",
    buyerCompanyName: "Briquette Co.",
    transporterName: "GreenMove Logistics",
    deliveryStatus: "In transit",
    issueDate: "Pending"
  }
];

export const dashboards = {
  admin: {
    title: "System Admin Dashboard",
    active: "Dashboard",
    userRole: "admin",
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
    approvals: ["New industry verification", "Transport provider license", "Material quality report", "Company sustainability badge"]
  },
  industry: {
    title: "Waste Producer Dashboard",
    active: "Materials",
    userRole: "industry",
    stats: [
      { label: "My listed waste", value: "36", detail: "8 available now", tone: "green" },
      { label: "Monthly disposal saved", value: "RWF 420k", detail: "estimated cost saved", tone: "blue" },
      { label: "Revenue from waste", value: "RWF 1.8M", detail: "this quarter", tone: "orange" },
      { label: "Sustainability score", value: "86/100", detail: "Gold level", tone: "green" }
    ],
    listings: ["Plastic scraps - 2.4 tons - Available", "Packaging paper - 600 kg - Requested", "Metal dust - 300 kg - Under review", "Wood residue - 1.1 tons - Available"],
    scoreBreakdown: [
      { label: "Reuse rate", value: 88 },
      { label: "Quality uploads", value: 72 },
      { label: "Delivery completion", value: 94 },
      { label: "Certificate history", value: 86 }
    ]
  },
  buyer: {
    title: "Recycler / SME Dashboard",
    active: "Marketplace",
    userRole: "buyer",
    stats: [
      { label: "Matched materials", value: "24", detail: "based on needs", tone: "green" },
      { label: "Saved cost", value: "RWF 310k", detail: "vs normal supply", tone: "blue" },
      { label: "Active requests", value: "7", detail: "awaiting supplier", tone: "orange" },
      { label: "Certificates received", value: "18", detail: "reuse proof", tone: "green" }
    ],
    preferences: ["Plastic", "Metal", "Paper", "Wood", "Textile", "Organic"]
  },
  transporter: {
    title: "Transport Provider Dashboard",
    active: "Transport",
    userRole: "transporter",
    stats: [
      { label: "Available jobs", value: "12", detail: "near your location", tone: "green" },
      { label: "In transit", value: "4", detail: "active deliveries", tone: "blue" },
      { label: "Completed", value: "96", detail: "total jobs", tone: "orange" },
      { label: "Rating", value: "4.7/5", detail: "from companies", tone: "green" }
    ]
  },
  regulator: {
    title: "COPED / Waste Operator Dashboard",
    active: "Analytics",
    userRole: "regulator",
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
    title: "Analytics & Waste Prediction",
    active: "Analytics",
    userRole: "admin",
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

export const managementRows = {
  users: [
    { name: "Aline Uwimana", email: "admin@waste2value.rw", role: "Admin", status: "Active" },
    { name: "Eric Nkurunziza", email: "industry@waste2value.rw", role: "Industry", status: "Active" },
    { name: "Grace Mukamana", email: "buyer@waste2value.rw", role: "Buyer", status: "Active" },
    { name: "Patrick Habimana", email: "transport@waste2value.rw", role: "Transporter", status: "Active" }
  ],
  companies: [
    { company: "Kigali Plastics Ltd", type: "Industry", district: "Gasabo", status: "Verified" },
    { company: "Eco Recycle Rwanda", type: "Buyer", district: "Nyarugenge", status: "Verified" },
    { company: "COPED Group Rwanda", type: "Waste Operator", district: "Gasabo", status: "Verified" },
    { company: "Kigali Metal Works", type: "Waste Producer", district: "Gasabo", status: "Pending" },
    { company: "GreenMove Logistics", type: "Transport", district: "Kicukiro", status: "Verified" }
  ],
  requests: [
    { material: "Plastic scraps", company: "Eco Recycle Rwanda", quantity: "1.5 tons", status: "Approved" },
    { material: "Metal offcuts", company: "FabLab SME", quantity: "500 kg", status: "Pending" },
    { material: "Wood residues", company: "Briquette Co.", quantity: "1.2 tons", status: "Negotiating" }
  ],
  complaints: [
    { report: "Cancelled delivery", company: "FabLab SME", priority: "Medium", status: "Open" },
    { report: "Missing quality document", company: "Kigali Metal Works", priority: "High", status: "Review" },
    { report: "Late pickup", company: "GreenMove Logistics", priority: "Low", status: "Resolved" }
  ],
  notifications: [
    { title: "New material match", type: "Match", status: "Unread", date: "11 Jun 2026" },
    { title: "Certificate generated", type: "Certificate", status: "Unread", date: "11 Jun 2026" },
    { title: "Delivery completed", type: "Transport", status: "Read", date: "10 Jun 2026" }
  ]
};
