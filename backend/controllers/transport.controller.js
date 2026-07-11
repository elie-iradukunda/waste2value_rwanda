const { Op } = require("sequelize");
const { TransportJob, Transaction, WasteMaterial, Company, Certificate, Notification, User } = require("../models");
const { serializeTransportJob } = require("../utils/serialize");

const includeGraph = [
  { model: Transaction, as: "transaction", include: [{ model: WasteMaterial, as: "material" }, { model: Company, as: "buyer" }, { model: Company, as: "seller" }] },
  { model: Company, as: "transporter" }
];

exports.jobs = async (req, res) => {
  const company = await Company.findOne({ where: { userId: req.user.id } });

  if (req.user.role === "admin" || req.user.role === "regulator") {
    const jobs = await TransportJob.findAll({ include: includeGraph, order: [["createdAt", "DESC"]] });
    return res.json({ success: true, transportJobs: jobs.map(serializeTransportJob) });
  }

  if (req.user.role === "buyer") {
    const jobs = await TransportJob.findAll({
      include: includeGraph,
      where: { "$transaction.buyerCompanyId$": company?.id || 0 },
      order: [["createdAt", "DESC"]]
    });
    return res.json({ success: true, transportJobs: jobs.map(serializeTransportJob) });
  }

  const jobs = await TransportJob.findAll({
    where: { [Op.or]: [{ status: "pending" }, { transporterCompanyId: company?.id || 0 }] },
    include: includeGraph,
    order: [["createdAt", "DESC"]]
  });
  return res.json({ success: true, transportJobs: jobs.map(serializeTransportJob) });
};

async function issueCertificateForTransaction(transaction) {
  const existing = await Certificate.findOne({ where: { transactionId: transaction.id } });
  if (existing) return existing;

  const job = await TransportJob.findOne({ where: { transactionId: transaction.id }, include: [{ model: Company, as: "transporter" }] });

  return Certificate.create({
    transactionId: transaction.id,
    certificateNumber: `WTV-RW-${new Date().getFullYear()}-${String(100000 + transaction.id)}`,
    materialType: transaction.material.title,
    quantityReused: `${Number(transaction.quantity)} ${transaction.material.unit}`,
    sellerCompanyName: transaction.seller.companyName,
    buyerCompanyName: transaction.buyer.companyName,
    transporterName: job?.transporter?.companyName || "Not yet assigned",
    issueDate: new Date(),
    verificationStatus: "verified"
  });
}

exports.updateStatus = async (req, res) => {
  const job = await TransportJob.findByPk(req.params.id, { include: includeGraph });
  if (!job) {
    return res.status(404).json({ success: false, message: "Transport job not found" });
  }

  const status = String(req.body.status || "").toLowerCase().replace(/\s+/g, "_");
  const allowed = ["pending", "accepted", "picked_up", "in_transit", "delivered", "confirmed", "cancelled"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid transport status" });
  }

  if (req.user.role === "buyer") {
    const buyerCompany = await Company.findOne({ where: { userId: req.user.id } });
    if (status !== "confirmed" || !job.transaction || job.transaction.buyerCompanyId !== buyerCompany?.id) {
      return res.status(403).json({ success: false, message: "Buyers can only confirm receipt of their own delivery" });
    }
  }

  if (status === "accepted" && req.user.role === "transporter") {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    job.transporterCompanyId = company?.id || job.transporterCompanyId;
  }

  job.status = status;
  await job.save();

  if (job.transaction) {
    if (status === "in_transit" || status === "picked_up") {
      job.transaction.transactionStatus = "in_transit";
      await job.transaction.save();
    }
    if (status === "delivered") {
      job.transaction.transactionStatus = "delivered";
      await job.transaction.save();
      await Notification.create({
        userId: (await User.findOne({ include: [{ model: Company, as: "company", where: { id: job.transaction.buyerCompanyId } }] }))?.id,
        title: "Delivery arrived",
        message: `${job.transaction.material?.title || "Your material"} has been delivered. Please confirm receipt.`,
        type: "delivery"
      }).catch(() => {});
    }
    if (status === "confirmed") {
      job.transaction.transactionStatus = "completed";
      await job.transaction.save();
      const material = await WasteMaterial.findByPk(job.transaction.materialId);
      if (material) {
        material.status = "sold";
        await material.save();
      }
      await issueCertificateForTransaction(job.transaction);
    }
  }

  if (status === "accepted") {
    const admins = await User.findAll({ where: { role: "admin" } });
    await Promise.all(admins.map((admin) => Notification.create({
      userId: admin.id,
      title: "Transport job accepted",
      message: `A transport provider accepted delivery for ${job.transaction?.material?.title || "a waste material"}.`,
      type: "delivery"
    })));
  }

  const fresh = await TransportJob.findByPk(job.id, { include: includeGraph });

  return res.json({
    success: true,
    message: "Transport job status updated",
    id: job.id,
    status: job.status,
    item: serializeTransportJob(fresh)
  });
};

exports.dashboard = async (req, res) => {
  const company = await Company.findOne({ where: { userId: req.user.id } });
  const companyId = company?.id || 0;

  const [available, inProgress, completed] = await Promise.all([
    TransportJob.count({ where: { status: "pending" } }),
    TransportJob.count({ where: { transporterCompanyId: companyId, status: { [Op.in]: ["accepted", "picked_up", "in_transit"] } } }),
    TransportJob.count({ where: { transporterCompanyId: companyId, status: { [Op.in]: ["delivered", "confirmed"] } } })
  ]);

  return res.json({
    success: true,
    role: "transporter",
    dashboard: {
      title: "Transport Provider Dashboard",
      active: "Jobs",
      userRole: "transporter",
      stats: [
        { label: "Delivery requests available", value: String(available), detail: "waiting to be accepted", tone: "green" },
        { label: "In progress", value: String(inProgress), detail: "picked up or in transit", tone: "blue" },
        { label: "Delivered and confirmed", value: String(completed), detail: "completed jobs", tone: "orange" }
      ]
    },
    jobs: (await TransportJob.findAll({ where: { [Op.or]: [{ status: "pending" }, { transporterCompanyId: companyId }] }, include: includeGraph, order: [["createdAt", "DESC"]] })).map(serializeTransportJob)
  });
};
