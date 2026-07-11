const { MaterialRequest, WasteMaterial, MaterialCategory, Company, Transaction, TransportJob, Notification, User } = require("../models");
const { serializeRequest } = require("../utils/serialize");

const includeGraph = [
  { model: WasteMaterial, as: "material", include: [{ model: MaterialCategory, as: "category" }] },
  { model: Company, as: "buyer" },
  { model: Company, as: "seller" }
];

async function notifyCompanyOwner(companyId, payload) {
  const company = await Company.findByPk(companyId);
  if (!company) return;
  const user = await User.findOne({ where: { id: company.userId } });
  if (!user) return;
  await Notification.create({ userId: user.id, ...payload });
}

exports.list = async (req, res) => {
  let where = {};

  if (req.user.role !== "admin") {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    const companyId = company?.id || 0;
    where = req.user.role === "buyer" ? { buyerCompanyId: companyId } : { sellerCompanyId: companyId };
  }

  const requests = await MaterialRequest.findAll({ where, include: includeGraph, order: [["createdAt", "DESC"]] });
  return res.json({ success: true, materialRequests: requests.map(serializeRequest) });
};

exports.createRequest = async (req, res) => {
  const buyerCompany = await Company.findOne({ where: { userId: req.user.id } });
  if (!buyerCompany) {
    return res.status(403).json({ success: false, message: "Only a registered company can request materials" });
  }

  const material = await WasteMaterial.findByPk(req.body.materialId);
  if (!material) {
    return res.status(404).json({ success: false, message: "Material not found" });
  }

  const request = await MaterialRequest.create({
    materialId: material.id,
    buyerCompanyId: buyerCompany.id,
    sellerCompanyId: material.companyId,
    requestedQuantity: Number(req.body.requestedQuantity) || Number(material.quantity),
    message: req.body.message || "Material request submitted from the marketplace.",
    offeredPrice: req.body.offeredPrice ? Number(req.body.offeredPrice) : null,
    status: "pending"
  });

  await notifyCompanyOwner(material.companyId, {
    title: "New material request",
    message: `${buyerCompany.companyName} requested "${material.title}".`,
    type: "request"
  });

  const fresh = await MaterialRequest.findByPk(request.id, { include: includeGraph });

  return res.status(201).json({
    success: true,
    message: "Material request sent",
    request: serializeRequest(fresh)
  });
};

exports.updateStatus = async (req, res) => {
  const request = await MaterialRequest.findByPk(req.params.id, { include: includeGraph });
  if (!request) {
    return res.status(404).json({ success: false, message: "Request not found" });
  }

  const status = String(req.body.status || "").toLowerCase();
  const allowed = ["pending", "approved", "rejected", "negotiating", "cancelled"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid request status" });
  }

  if (req.user.role === "buyer") {
    const buyerCompany = await Company.findOne({ where: { userId: req.user.id } });
    if (status !== "cancelled" || !buyerCompany || buyerCompany.id !== request.buyerCompanyId) {
      return res.status(403).json({ success: false, message: "Buyers may only cancel their own pending request" });
    }
  } else if (req.user.role !== "admin") {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company || company.id !== request.sellerCompanyId) {
      return res.status(403).json({ success: false, message: "Only the receiving company can update this request" });
    }
  }

  request.status = status;
  request.rejectionReason = status === "rejected" ? (req.body.reason || null) : request.rejectionReason;
  await request.save();

  let transaction = null;
  if (status === "approved") {
    request.material.status = "reserved";
    await request.material.save();

    transaction = await Transaction.findOne({ where: { requestId: request.id } });
    if (!transaction) {
      const unitPrice = Number(request.offeredPrice) || Number(request.material.price) || 0;
      transaction = await Transaction.create({
        requestId: request.id,
        materialId: request.materialId,
        buyerCompanyId: request.buyerCompanyId,
        sellerCompanyId: request.sellerCompanyId,
        quantity: request.requestedQuantity,
        totalAmount: unitPrice * Number(request.requestedQuantity || 0),
        paymentStatus: "pending",
        transactionStatus: "waiting_transport"
      });

      const buyerCompany = await Company.findByPk(request.buyerCompanyId);
      await TransportJob.create({
        transactionId: transaction.id,
        pickupLocation: request.material.pickupAddress || `${request.material.district} pickup point`,
        deliveryLocation: buyerCompany?.address || `${buyerCompany?.district || "Kigali"} delivery point`,
        status: "pending"
      });
    }

    await notifyCompanyOwner(request.buyerCompanyId, {
      title: "Material request approved",
      message: `Your request for "${request.material.title}" was approved. Transport is being arranged.`,
      type: "request"
    });
  }

  if (status === "rejected") {
    await notifyCompanyOwner(request.buyerCompanyId, {
      title: "Material request declined",
      message: `Your request for "${request.material.title}" was declined by the supplier.`,
      type: "request"
    });
  }

  return res.json({
    success: true,
    message: "Request status updated",
    id: request.id,
    status: request.status,
    item: serializeRequest(request),
    transactionId: transaction?.id
  });
};
