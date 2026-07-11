const { Op, fn, col, literal } = require("sequelize");
const { User, Company, WasteMaterial, MaterialCategory, Transaction, TransportJob, Certificate, MaterialRequest } = require("../models");
const { serializeUser, serializeTransaction } = require("../utils/serialize");
const companyController = require("./company.controller");
const materialController = require("./material.controller");
const requestController = require("./request.controller");

exports.users = async (_req, res) => {
  const users = await User.findAll({ include: [{ model: Company, as: "company" }], order: [["createdAt", "DESC"]] });
  return res.json({
    success: true,
    users: users.map((user) => ({
      ...serializeUser(user),
      companyName: user.company?.companyName,
      companyVerificationStatus: user.company?.verificationStatus || null
    }))
  });
};

async function pendingApprovals() {
  const [companies, materials, requests] = await Promise.all([
    Company.findAll({ where: { verificationStatus: "pending" }, limit: 5 }),
    WasteMaterial.findAll({ where: { status: "pending_review" }, limit: 5 }),
    MaterialRequest.findAll({ where: { status: "pending" }, limit: 5 })
  ]);

  return [
    ...companies.map((company) => ({ id: company.id, type: "Company", title: `Verify company: ${company.companyName}`, priority: "Review", status: "pending" })),
    ...materials.map((material) => ({ id: material.id, type: "Material", title: `Approve waste listing: ${material.title}`, priority: "Review", status: "pending" })),
    ...requests.map((request) => ({ id: request.id, type: "Request", title: `Review material request #${request.id}`, priority: "Review", status: "pending" }))
  ].slice(0, 8);
}

exports.approvals = async (_req, res) => {
  return res.json({ success: true, approvals: await pendingApprovals() });
};

exports.dashboard = async (_req, res) => {
  const [companiesCount, materialsCount, transactionsCount, wasteDiverted, weeklyActivity, approvals, recentTransactions] = await Promise.all([
    Company.count(),
    WasteMaterial.count(),
    Transaction.count(),
    Transaction.sum("quantity", { where: { transactionStatus: { [Op.in]: ["delivered", "completed"] } } }),
    WasteMaterial.findAll({
      attributes: [[fn("DAYNAME", col("createdAt")), "day"], [fn("COUNT", col("id")), "count"]],
      where: { createdAt: { [Op.gte]: literal("DATE_SUB(NOW(), INTERVAL 7 DAY)") } },
      group: [fn("DAYNAME", col("createdAt"))],
      raw: true
    }),
    pendingApprovals(),
    Transaction.findAll({
      include: [
        { model: WasteMaterial, as: "material", include: [{ model: MaterialCategory, as: "category" }] },
        { model: Company, as: "buyer" },
        { model: Company, as: "seller" },
        { model: TransportJob, as: "transportJob" },
        { model: Certificate, as: "certificate" }
      ],
      order: [["createdAt", "DESC"]],
      limit: 5
    })
  ]);

  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const shortDay = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun" };
  const countByDay = Object.fromEntries(weeklyActivity.map((row) => [row.day, Number(row.count)]));
  const maxCount = Math.max(1, ...dayOrder.map((day) => countByDay[day] || 0));

  return res.json({
    success: true,
    dashboard: {
      title: "System Admin Dashboard",
      active: "Dashboard",
      userRole: "admin",
      stats: [
        { label: "Registered companies", value: String(companiesCount), detail: "across all roles", tone: "green" },
        { label: "Listed materials", value: String(materialsCount), detail: "plastic, metal, wood and more", tone: "blue" },
        { label: "Transactions", value: String(transactionsCount), detail: "completed exchanges", tone: "orange" },
        { label: "Waste diverted", value: `${Number(wasteDiverted || 0).toLocaleString()} units`, detail: "delivered or completed", tone: "green" }
      ],
      activity: dayOrder.map((day) => ({ label: shortDay[day], value: Math.round(((countByDay[day] || 0) / maxCount) * 100) })),
      approvals
    },
    transactions: recentTransactions.map(serializeTransaction)
  });
};

exports.suspendUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  user.status = req.body.status === "active" ? "active" : "suspended";
  user.statusReason = user.status === "suspended" ? (req.body.reason || null) : null;
  await user.save();

  return res.json({ success: true, message: `User ${user.status}`, id: user.id, status: user.status });
};

exports.verifyUserCompany = async (req, res) => {
  const company = await Company.findOne({ where: { userId: req.params.id } });
  if (!company) {
    return res.status(404).json({ success: false, message: "This user has no company profile to verify" });
  }

  company.verificationStatus = req.body.status === "rejected" ? "rejected" : "verified";
  await company.save();

  return res.json({ success: true, message: "Company verification updated", id: company.id, status: company.verificationStatus });
};

exports.resolveApproval = async (req, res) => {
  const { type, id } = req.params;
  const approve = String(req.body.status || "approved").toLowerCase() !== "rejected";
  req.params.id = id;

  if (type === "Company") {
    req.body.status = approve ? "verified" : "rejected";
    return companyController.verify(req, res);
  }

  if (type === "Material") {
    req.body.status = approve ? "available" : "rejected";
    return materialController.updateStatus(req, res);
  }

  if (type === "Request") {
    req.body.status = approve ? "approved" : "rejected";
    return requestController.updateStatus(req, res);
  }

  return res.status(400).json({ success: false, message: "Unknown approval type" });
};
