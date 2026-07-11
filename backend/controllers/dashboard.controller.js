const { Company, WasteMaterial, MaterialCategory, MaterialRequest, Certificate } = require("../models");
const { serializeMaterial } = require("../utils/serialize");

exports.industryDashboard = async (req, res) => {
  const company = await Company.findOne({ where: { userId: req.user.id } });
  const companyId = company?.id || 0;

  const materials = await WasteMaterial.findAll({
    where: { companyId },
    include: [{ model: MaterialCategory, as: "category" }],
    order: [["createdAt", "DESC"]]
  });

  const available = materials.filter((material) => material.status === "available").length;
  const pendingRequests = await MaterialRequest.count({ where: { sellerCompanyId: companyId, status: "pending" } });
  const certificatesCount = await Certificate.count({ where: { sellerCompanyName: company?.companyName || "__none__" } });

  return res.json({
    success: true,
    dashboard: {
      title: "Waste Producer Dashboard",
      active: "Dashboard",
      userRole: "industry",
      stats: [
        { label: "My listed waste", value: String(materials.length), detail: `${available} available now`, tone: "green" },
        { label: "Requests to approve", value: String(pendingRequests), detail: "awaiting your decision", tone: "orange" },
        { label: "Reuse certificates", value: String(certificatesCount), detail: "issued for my materials", tone: "blue" }
      ],
      listings: materials.slice(0, 5).map((material) => `${material.title} - ${Number(material.quantity)} ${material.unit} - ${material.status.replace(/_/g, " ")}`)
    },
    materials: materials.map(serializeMaterial)
  });
};

exports.buyerDashboard = async (req, res) => {
  const company = await Company.findOne({ where: { userId: req.user.id } });
  const companyId = company?.id || 0;

  const [availableMaterials, myRequests] = await Promise.all([
    WasteMaterial.findAll({ where: { status: "available" }, include: [{ model: MaterialCategory, as: "category" }, { model: Company, as: "seller" }], order: [["createdAt", "DESC"]] }),
    MaterialRequest.findAll({ where: { buyerCompanyId: companyId } })
  ]);

  const activeRequests = myRequests.filter((request) => ["pending", "negotiating"].includes(request.status)).length;
  const approvedRequests = myRequests.filter((request) => request.status === "approved").length;

  return res.json({
    success: true,
    dashboard: {
      title: "Recycler / SME Dashboard",
      active: "Dashboard",
      userRole: "buyer",
      stats: [
        { label: "Materials available", value: String(availableMaterials.length), detail: "on the marketplace", tone: "green" },
        { label: "My active requests", value: String(activeRequests), detail: "awaiting supplier response", tone: "orange" },
        { label: "Approved requests", value: String(approvedRequests), detail: "ready for delivery", tone: "blue" }
      ]
    },
    materials: availableMaterials.map(serializeMaterial)
  });
};
