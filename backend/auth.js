const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { sequelize, Company, User } = require("./models");
const { AppError } = require("./workflow.js");

const JWT_SECRET = process.env.JWT_SECRET || "wastetovalue-dev-secret";
const MAX_RDB_DOCUMENT_LENGTH = 5_000_000;

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId }, JWT_SECRET, { expiresIn: "1d" });
}

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: "Authentication token required" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (_error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: "Permission denied" });
    }
    return next();
  };
}

function cleanText(value, max = 1000) {
  const text = String(value || "").trim();
  return text ? text.slice(0, max) : null;
}

function cleanRdbDocument(dataUrl) {
  if (!dataUrl) return null;
  if (typeof dataUrl !== "string") throw new AppError(400, "RDB document must be a valid upload");
  if (!/^data:(application\/pdf|image\/(png|jpe?g|webp));base64,/i.test(dataUrl)) {
    throw new AppError(400, "RDB document must be a PDF, PNG, JPG or WEBP file");
  }
  if (dataUrl.length > MAX_RDB_DOCUMENT_LENGTH) {
    throw new AppError(400, "RDB document is too large. Upload a smaller file.");
  }
  return dataUrl;
}

// Registers public company accounts. Producers wait for admin approval;
// recyclers can start requesting approved marketplace materials immediately.
async function register(body) {
  const {
    name,
    email,
    password,
    role,
    companyName,
    phone,
    registrationNumber,
    businessLocation,
    producedMaterials,
    productionDescription,
    rdbDocumentName,
    rdbDocumentDataUrl
  } = body || {};
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanRole = String(role || "").trim().toUpperCase();
  if (!name || !email || !password || !cleanRole) throw new AppError(400, "name, email, password and role are required");
  if (!["PRODUCER", "RECYCLER"].includes(cleanRole)) throw new AppError(400, "Only producers and recyclers can register publicly. Transport staff accounts are created by approved producers.");
  if (!companyName) throw new AppError(400, "companyName is required");

  const producerDetails = cleanRole === "PRODUCER"
    ? {
        registrationNumber: cleanText(registrationNumber, 80),
        businessLocation: cleanText(businessLocation, 180),
        producedMaterials: cleanText(producedMaterials, 1000),
        productionDescription: cleanText(productionDescription, 1600),
        rdbDocumentName: cleanText(rdbDocumentName, 180) || "RDB registration document",
        rdbDocumentDataUrl: cleanRdbDocument(rdbDocumentDataUrl)
      }
    : {
        registrationNumber: null,
        businessLocation: cleanText(businessLocation, 180),
        producedMaterials: null,
        productionDescription: null,
        rdbDocumentName: null,
        rdbDocumentDataUrl: null
      };

  if (cleanRole === "PRODUCER") {
    if (!producerDetails.businessLocation) throw new AppError(400, "Producer business location is required");
    if (!producerDetails.producedMaterials) throw new AppError(400, "Producer materials/products are required");
    if (!producerDetails.productionDescription) throw new AppError(400, "Producer profile description is required");
    if (!producerDetails.rdbDocumentDataUrl) throw new AppError(400, "RDB registration document is required for producer approval");
  }

  const existing = await User.findOne({ where: { email: cleanEmail } });
  if (existing) throw new AppError(400, "An account with this email already exists");

  const passwordHash = await bcrypt.hash(password, 10);

  return sequelize.transaction(async (t) => {
    const status = cleanRole === "RECYCLER" ? "APPROVED" : "PENDING";
    const company = await Company.create({
      name: companyName,
      type: cleanRole,
      contactEmail: cleanEmail,
      phone: phone || null,
      status,
      ...producerDetails
    }, { transaction: t });
    const user = await User.create({ name, email: cleanEmail, passwordHash, role: cleanRole, companyId: company.id }, { transaction: t });
    const token = signToken(user);
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId } };
  });
}

async function login(body) {
  const { email, password } = body || {};
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail || !password) throw new AppError(400, "email and password are required");

  const user = await User.findOne({ where: { email: cleanEmail } });
  if (!user) throw new AppError(401, "Invalid email or password");
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, "Invalid email or password");

  const token = signToken(user);
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId } };
}

module.exports = { authenticate, authorize, register, login };
