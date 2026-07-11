const { Company, Notification, User } = require("../models");
const { serializeCompany } = require("../utils/serialize");

exports.verify = async (req, res) => {
  const company = await Company.findByPk(req.params.id);
  if (!company) {
    return res.status(404).json({ success: false, message: "Company not found" });
  }

  const status = String(req.body.status || "").toLowerCase();
  const allowed = ["pending", "verified", "rejected"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid verification status" });
  }

  company.verificationStatus = status;
  await company.save();

  const owner = await User.findByPk(company.userId);
  if (owner) {
    await Notification.create({
      userId: owner.id,
      title: status === "verified" ? "Company verified" : "Company verification update",
      message: `${company.companyName} verification status changed to ${status}.`,
      type: "account"
    });
  }

  return res.json({
    success: true,
    message: "Company verification status updated",
    id: company.id,
    status: company.verificationStatus,
    item: serializeCompany(company)
  });
};
