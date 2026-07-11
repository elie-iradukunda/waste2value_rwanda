const { Op } = require("sequelize");
const { WasteMaterial, MaterialCategory, Company, Transaction } = require("../models");
const { serializeMaterial } = require("../utils/serialize");

exports.home = async (_req, res) => {
  const [wasteDiverted, activeCompanies, completedExchanges, featuredMaterials] = await Promise.all([
    Transaction.sum("quantity", { where: { transactionStatus: { [Op.in]: ["delivered", "completed"] } } }),
    Company.count({ where: { verificationStatus: "verified" } }),
    Transaction.count({ where: { transactionStatus: "completed" } }),
    WasteMaterial.findAll({
      where: { status: "available" },
      include: [{ model: MaterialCategory, as: "category" }, { model: Company, as: "seller" }],
      order: [["createdAt", "DESC"]],
      limit: 3
    })
  ]);

  const totalMaterials = await WasteMaterial.count();
  const reuseSuccess = totalMaterials ? Math.round((completedExchanges / totalMaterials) * 100) : 0;

  return res.json({
    success: true,
    stats: [
      { label: "Units diverted so far", value: `${Number(wasteDiverted || 0).toLocaleString()}+` },
      { label: "Active companies", value: String(activeCompanies) },
      { label: "Completed exchanges", value: String(completedExchanges) },
      { label: "Reuse success", value: `${reuseSuccess}%` }
    ],
    featuredMaterials: featuredMaterials.map(serializeMaterial),
    roles: [
      { role: "admin", title: "Admin", duties: ["manage users", "approve listings", "view dashboard reports"] },
      { role: "industry", title: "Waste Producer", duties: ["post waste materials", "approve requests", "view reuse certificates"] },
      { role: "buyer", title: "Recycler / SME", duties: ["search materials", "request or reserve waste", "confirm received items"] },
      { role: "transporter", title: "Transport Provider", duties: ["accept pickup jobs", "update delivery status", "confirm delivery"] },
      { role: "regulator", title: "COPED / Waste Operator", duties: ["verify quality", "monitor recovery", "generate reports"] }
    ]
  });
};
