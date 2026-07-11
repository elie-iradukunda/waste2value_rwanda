const { Op, fn, col } = require("sequelize");
const { WasteMaterial, MaterialCategory, Company, Transaction, Certificate, TransportJob } = require("../models");

async function categoryTotals() {
  const rows = await WasteMaterial.findAll({
    attributes: [[fn("SUM", col("quantity")), "total"]],
    include: [{ model: MaterialCategory, as: "category", attributes: ["name"] }],
    group: ["category.id", "category.name"],
    raw: true
  });

  const totals = rows
    .map((row) => ({ label: row["category.name"] || "Other", quantity: Math.round(Number(row.total) || 0) }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const grandTotal = totals.reduce((sum, item) => sum + item.quantity, 0) || 1;

  return totals.map((item) => ({
    label: item.label,
    quantity: item.quantity,
    value: Math.round((item.quantity / grandTotal) * 100)
  }));
}

exports.reports = async (_req, res) => {
  const [companiesCount, materialsCount, wasteDiverted, certifiedCount, activeCollectionJobs] = await Promise.all([
    Company.count(),
    WasteMaterial.count(),
    Transaction.sum("quantity", { where: { transactionStatus: { [Op.in]: ["delivered", "completed"] } } }),
    Certificate.count(),
    TransportJob.count({ where: { status: { [Op.in]: ["pending", "accepted", "picked_up", "in_transit"] } } })
  ]);

  return res.json({
    success: true,
    dashboard: {
      title: "Reports",
      active: "Reports",
      stats: [
        { label: "Registered companies", value: String(companiesCount), detail: "across all roles", tone: "green" },
        { label: "Listed materials", value: String(materialsCount), detail: "all categories", tone: "blue" },
        { label: "Waste diverted", value: `${Number(wasteDiverted || 0).toLocaleString()} units`, detail: "delivered or completed", tone: "green" },
        { label: "Certificates issued", value: String(certifiedCount), detail: "verified reuse proof", tone: "orange" }
      ],
      impact: await categoryTotals(),
      activeCollectionJobs
    }
  });
};

exports.regulatorDashboard = async (_req, res) => {
  const [pendingQuality, activeCollectionJobs, wasteDiverted, certifiedCount] = await Promise.all([
    WasteMaterial.count({ where: { status: "available", qualityVerified: false } }),
    TransportJob.count({ where: { status: { [Op.in]: ["pending", "accepted", "picked_up", "in_transit"] } } }),
    Transaction.sum("quantity", { where: { transactionStatus: { [Op.in]: ["delivered", "completed"] } } }),
    Certificate.count()
  ]);

  return res.json({
    success: true,
    dashboard: {
      title: "COPED / Waste Operator Dashboard",
      active: "Dashboard",
      userRole: "regulator",
      stats: [
        { label: "Awaiting quality verification", value: String(pendingQuality), detail: "materials to inspect", tone: "orange" },
        { label: "Active collection jobs", value: String(activeCollectionJobs), detail: "being coordinated", tone: "blue" },
        { label: "Waste diverted", value: `${Number(wasteDiverted || 0).toLocaleString()} units`, detail: "verified reuse and recycling", tone: "green" },
        { label: "Certificates issued", value: String(certifiedCount), detail: "verified reuse proof", tone: "green" }
      ],
      impact: await categoryTotals()
    }
  });
};
