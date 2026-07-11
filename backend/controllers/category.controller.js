const { MaterialCategory } = require("../models");

exports.list = async (_req, res) => {
  const categories = await MaterialCategory.findAll({ order: [["name", "ASC"]] });
  return res.json({ success: true, categories });
};

exports.create = async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) {
    return res.status(400).json({ success: false, message: "Category name is required" });
  }

  const existing = await MaterialCategory.findOne({ where: { name } });
  if (existing) {
    return res.status(409).json({ success: false, message: "A category with this name already exists" });
  }

  const category = await MaterialCategory.create({
    name,
    description: req.body.description || "",
    icon: req.body.icon || "recycle"
  });

  return res.status(201).json({ success: true, message: "Category created", category });
};

exports.setStatus = async (req, res) => {
  const category = await MaterialCategory.findByPk(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }

  category.status = category.status === "active" ? "inactive" : "active";
  await category.save();

  return res.json({ success: true, message: `Category marked ${category.status}`, id: category.id, status: category.status });
};
