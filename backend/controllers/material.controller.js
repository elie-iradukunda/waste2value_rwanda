const { WasteMaterial, MaterialCategory, MaterialImage, Company, Notification, User } = require("../models");
const { serializeMaterial } = require("../utils/serialize");

const includeGraph = [
  { model: MaterialCategory, as: "category" },
  { model: Company, as: "seller" },
  { model: MaterialImage, as: "images" }
];

exports.list = async (_req, res) => {
  const materials = await WasteMaterial.findAll({ where: { status: "available" }, include: includeGraph, order: [["createdAt", "DESC"]] });
  return res.json({ success: true, materials: materials.map(serializeMaterial) });
};

exports.mine = async (req, res) => {
  const company = await Company.findOne({ where: { userId: req.user.id } });
  const materials = await WasteMaterial.findAll({ where: { companyId: company?.id || 0 }, include: includeGraph, order: [["createdAt", "DESC"]] });
  return res.json({ success: true, materials: materials.map(serializeMaterial) });
};

exports.pendingApproval = async (_req, res) => {
  const materials = await WasteMaterial.findAll({ where: { status: "pending_review" }, include: includeGraph, order: [["createdAt", "DESC"]] });
  return res.json({ success: true, materials: materials.map(serializeMaterial) });
};

exports.qualityQueue = async (_req, res) => {
  const materials = await WasteMaterial.findAll({ where: { status: "available" }, include: includeGraph, order: [["qualityVerified", "ASC"], ["createdAt", "DESC"]] });
  return res.json({ success: true, materials: materials.map(serializeMaterial) });
};

exports.categories = async (_req, res) => {
  const categories = await MaterialCategory.findAll({ where: { status: "active" }, order: [["name", "ASC"]] });
  return res.json({ success: true, categories });
};

exports.materialDetails = async (req, res) => {
  const material = await WasteMaterial.findByPk(req.params.id, { include: includeGraph });
  if (!material) {
    return res.status(404).json({ success: false, message: "Material not found" });
  }
  return res.json({ success: true, material: serializeMaterial(material) });
};

exports.createMaterial = async (req, res) => {
  const company = await Company.findOne({ where: { userId: req.user.id } });
  if (!company && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Only a registered company can list waste materials" });
  }

  const categoryName = req.body.category || "Other";
  const [category] = await MaterialCategory.findOrCreate({
    where: { name: categoryName },
    defaults: { description: `${categoryName} waste category`, icon: "recycle" }
  });

  const material = await WasteMaterial.create({
    companyId: company ? company.id : req.body.companyId,
    categoryId: category.id,
    title: req.body.title || req.body.material_name || "Reusable waste material",
    description: req.body.description || req.body.safety_notes || "",
    quantity: Number(req.body.quantity) || 0,
    unit: req.body.unit || "kg",
    condition: req.body.condition || "Pending quality review",
    price: req.body.price && !Number.isNaN(Number(req.body.price)) ? Number(req.body.price) : 0,
    isFree: String(req.body.price || "").toLowerCase().includes("free"),
    district: req.body.district || company?.district || "Gasabo",
    sector: req.body.sector || company?.sector || "Kacyiru",
    pickupAddress: req.body.pickupAddress || `${req.body.district || company?.district || "Gasabo"} pickup point`,
    status: "pending_review",
    safetyNotes: req.body.safety_notes || req.body.safetyNotes || "Non-hazardous material only. Admin review required before publication.",
    availabilityDate: req.body.availabilityDate || null,
    expiryDate: req.body.expiryDate || null
  });

  if (req.file) {
    await MaterialImage.create({ materialId: material.id, imageUrl: `/uploads/${req.file.filename}`, isMain: true });
  }

  const admins = await User.findAll({ where: { role: "admin" } });
  await Promise.all(admins.map((admin) => Notification.create({
    userId: admin.id,
    title: "New waste listing submitted",
    message: `${material.title} is waiting for admin approval.`,
    type: "system"
  })));

  const fresh = await WasteMaterial.findByPk(material.id, { include: includeGraph });

  return res.status(201).json({
    success: true,
    message: "Material submitted for admin approval",
    material: serializeMaterial(fresh)
  });
};

exports.updateDetails = async (req, res) => {
  const material = await WasteMaterial.findByPk(req.params.id, { include: includeGraph });
  if (!material) {
    return res.status(404).json({ success: false, message: "Material not found" });
  }

  const company = await Company.findOne({ where: { userId: req.user.id } });
  if (req.user.role !== "admin" && (!company || company.id !== material.companyId)) {
    return res.status(403).json({ success: false, message: "You can only update your own listings" });
  }

  if (req.body.quantity !== undefined) material.quantity = Number(req.body.quantity) || material.quantity;
  if (req.body.district) material.district = req.body.district;
  if (req.body.sector) material.sector = req.body.sector;
  if (req.body.pickupAddress) material.pickupAddress = req.body.pickupAddress;

  await material.save();

  return res.json({
    success: true,
    message: "Listing quantity and location updated",
    item: serializeMaterial(material)
  });
};

exports.updateStatus = async (req, res) => {
  const material = await WasteMaterial.findByPk(req.params.id, { include: includeGraph });
  if (!material) {
    return res.status(404).json({ success: false, message: "Material not found" });
  }

  if (req.user.role !== "admin") {
    const company = await Company.findOne({ where: { userId: req.user.id } });
    if (!company || company.id !== material.companyId) {
      return res.status(403).json({ success: false, message: "You can only manage your own listings" });
    }
  }

  const status = String(req.body.status || "").toLowerCase().replace(/\s+/g, "_");
  const allowed = ["pending_review", "available", "reserved", "sold", "expired", "rejected"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid material status" });
  }
  material.status = status;
  material.rejectionReason = status === "rejected" ? (req.body.reason || null) : null;

  await material.save();

  if (material.status === "available") {
    const owner = await User.findOne({ include: [{ model: Company, as: "company", where: { id: material.companyId } }] });
    if (owner) {
      await Notification.create({
        userId: owner.id,
        title: "Waste listing approved",
        message: `${material.title} is now published on the marketplace.`,
        type: "system"
      });
    }
  }

  return res.json({
    success: true,
    message: "Material status updated",
    id: material.id,
    status: material.status,
    item: serializeMaterial(material)
  });
};

exports.verifyQuality = async (req, res) => {
  const material = await WasteMaterial.findByPk(req.params.id, { include: includeGraph });
  if (!material) {
    return res.status(404).json({ success: false, message: "Material not found" });
  }

  material.qualityVerified = true;
  material.qualityVerifiedAt = new Date();
  await material.save();

  return res.json({
    success: true,
    message: "Material quality verified",
    id: material.id,
    item: serializeMaterial(material)
  });
};
