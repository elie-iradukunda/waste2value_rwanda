function formatPrice(material) {
  if (material.isFree) return "Free pickup";
  const price = Number(material.price);
  if (!price) return "Negotiable";
  return `RWF ${price.toLocaleString()}/${material.unit}`;
}

function serializeMaterial(material) {
  const plain = typeof material.toJSON === "function" ? material.toJSON() : material;
  return {
    id: plain.id,
    title: plain.title,
    category: plain.category?.name || plain.categoryName || "Other",
    categoryId: plain.categoryId,
    quantity: Number(plain.quantity),
    unit: plain.unit,
    condition: plain.condition,
    price: formatPrice(plain),
    isFree: plain.isFree,
    district: plain.district,
    sector: plain.sector,
    seller: plain.seller?.companyName || plain.sellerName || "Waste Producer",
    companyId: plain.companyId,
    status: plain.status,
    qualityVerified: Boolean(plain.qualityVerified),
    rejectionReason: plain.rejectionReason,
    description: plain.description,
    pickupAddress: plain.pickupAddress,
    latitude: plain.latitude,
    longitude: plain.longitude,
    safetyNotes: plain.safetyNotes,
    reuseSuggestions: plain.reuseSuggestions,
    availabilityDate: plain.availabilityDate,
    expiryDate: plain.expiryDate,
    images: (plain.images || []).map((image) => image.imageUrl),
    createdAt: plain.createdAt
  };
}

function serializeCompany(company) {
  const plain = typeof company.toJSON === "function" ? company.toJSON() : company;
  return {
    id: plain.id,
    userId: plain.userId,
    companyName: plain.companyName,
    companyType: plain.companyType,
    district: plain.district,
    sector: plain.sector,
    address: plain.address,
    email: plain.email,
    phone: plain.phone,
    tinNumber: plain.tinNumber,
    licenseDocument: plain.licenseDocument,
    verificationStatus: plain.verificationStatus,
    sustainabilityScore: plain.sustainabilityScore
  };
}

function serializeUser(user) {
  const plain = typeof user.toJSON === "function" ? user.toJSON() : user;
  const { password, resetCode, resetCodeExpires, ...safe } = plain;
  return safe;
}

function serializeRequest(request) {
  const plain = typeof request.toJSON === "function" ? request.toJSON() : request;
  const material = plain.material || {};
  return {
    id: plain.id,
    materialId: plain.materialId,
    material: material.title || plain.materialTitle || "Reusable waste material",
    buyer: plain.buyer?.companyName || plain.buyerName || "Recycler / SME",
    seller: plain.seller?.companyName || plain.sellerName || "Waste Producer",
    buyerCompanyId: plain.buyerCompanyId,
    sellerCompanyId: plain.sellerCompanyId,
    quantity: plain.requestedQuantity ? `${Number(plain.requestedQuantity)} ${material.unit || ""}`.trim() : "Pending",
    requestedQuantity: plain.requestedQuantity,
    status: plain.status,
    offeredPrice: plain.offeredPrice ? `RWF ${Number(plain.offeredPrice).toLocaleString()}` : "Negotiable",
    message: plain.message,
    rejectionReason: plain.rejectionReason,
    createdAt: plain.createdAt
  };
}

function serializeTransaction(transaction) {
  const plain = typeof transaction.toJSON === "function" ? transaction.toJSON() : transaction;
  const statusLabel = {
    waiting_transport: "Waiting transport",
    in_transit: "In transit",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled"
  }[plain.transactionStatus] || plain.transactionStatus;

  return {
    id: plain.id,
    requestId: plain.requestId,
    materialId: plain.materialId,
    material: plain.material?.title || "Reusable waste material",
    seller: plain.seller?.companyName || "Waste Producer",
    buyer: plain.buyer?.companyName || "Recycler / SME",
    buyerCompanyId: plain.buyerCompanyId,
    sellerCompanyId: plain.sellerCompanyId,
    transport: plain.transportJob ? (plain.transportJob.status === "pending" ? "Pending" : "Assigned") : "Pending",
    status: statusLabel,
    transactionStatus: plain.transactionStatus,
    paymentStatus: plain.paymentStatus,
    certificate: plain.certificate ? "Generated" : "Waiting",
    totalAmount: `RWF ${Number(plain.totalAmount || 0).toLocaleString()}`,
    quantity: Number(plain.quantity),
    createdAt: plain.createdAt
  };
}

function serializeTransportJob(job) {
  const plain = typeof job.toJSON === "function" ? job.toJSON() : job;
  const materialTitle = plain.transaction?.material?.title || "Reusable waste material";
  const quantity = plain.transaction ? `${Number(plain.transaction.quantity)} ${plain.transaction.material?.unit || ""}`.trim() : "Pending";
  const route = `${plain.pickupLocation} -> ${plain.deliveryLocation}`;
  const action = plain.status === "pending" ? "Accept" : plain.status === "delivered" || plain.status === "confirmed" ? "Delivered" : "Update";
  const tone = plain.status === "pending" ? "green" : plain.status === "delivered" || plain.status === "confirmed" ? "blue" : "orange";

  return {
    id: plain.id,
    transactionId: plain.transactionId,
    transporterCompanyId: plain.transporterCompanyId,
    material: materialTitle,
    title: materialTitle,
    route,
    quantity,
    status: plain.status,
    offer: plain.transportCost ? `RWF ${Number(plain.transportCost).toLocaleString()}` : "Negotiable",
    action,
    tone,
    pickupLocation: plain.pickupLocation,
    deliveryLocation: plain.deliveryLocation,
    pickupDate: plain.pickupDate,
    deliveryDate: plain.deliveryDate,
    pickupProofImage: plain.pickupProofImage,
    deliveryProofImage: plain.deliveryProofImage,
    createdAt: plain.createdAt
  };
}

function serializeCertificate(certificate, verificationUrlBase) {
  const plain = typeof certificate.toJSON === "function" ? certificate.toJSON() : certificate;
  const verificationUrl = verificationUrlBase ? `${verificationUrlBase}/certificates?verify=${encodeURIComponent(plain.certificateNumber)}` : undefined;
  return {
    id: plain.id,
    transactionId: plain.transactionId,
    certificateNumber: plain.certificateNumber,
    materialType: plain.materialType,
    quantityReused: plain.quantityReused,
    sellerCompanyName: plain.sellerCompanyName,
    buyerCompanyName: plain.buyerCompanyName,
    transporterName: plain.transporterName,
    deliveryStatus: plain.verificationStatus === "verified" ? "Verified and completed" : "Pending verification",
    environmentalImpact: `${plain.quantityReused} diverted from landfill and confirmed for reuse`,
    issueDate: plain.issueDate,
    verificationStatus: plain.verificationStatus,
    verificationUrl,
    qrCodeUrl: verificationUrl || plain.qrCodeUrl
  };
}

function serializeNotification(notification) {
  const plain = typeof notification.toJSON === "function" ? notification.toJSON() : notification;
  return {
    id: plain.id,
    userId: plain.userId,
    title: plain.title,
    message: plain.message,
    type: plain.type,
    isRead: plain.isRead,
    date: plain.createdAt ? new Date(plain.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Today",
    createdAt: plain.createdAt
  };
}

module.exports = {
  serializeMaterial,
  serializeCompany,
  serializeUser,
  serializeRequest,
  serializeTransaction,
  serializeTransportJob,
  serializeCertificate,
  serializeNotification
};
