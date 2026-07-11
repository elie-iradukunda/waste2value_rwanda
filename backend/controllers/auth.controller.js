const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Company } = require("../models");
const { serializeUser, serializeCompany } = require("../utils/serialize");

const roleRedirects = {
  admin: "/admin",
  industry: "/industry",
  buyer: "/buyer",
  transporter: "/transport",
  regulator: "/regulator"
};

const roles = [
  { value: "admin", label: "Admin" },
  { value: "industry", label: "Waste Producer" },
  { value: "buyer", label: "Recycler / SME" },
  { value: "transporter", label: "Transport Provider" },
  { value: "regulator", label: "COPED / Waste Operator" }
];

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "wastetovalue-dev-secret",
    { expiresIn: "1d" }
  );
}

async function withCompany(user) {
  const company = await Company.findOne({ where: { userId: user.id } });
  return {
    ...serializeUser(user),
    company: company ? serializeCompany(company) : null
  };
}

exports.register = async (req, res) => {
  const fullName = String(req.body.fullName || "").trim();
  const email = String(req.body.email || "").toLowerCase().trim();
  const password = String(req.body.password || "");
  const role = String(req.body.role || "buyer").trim();
  const companyName = String(req.body.companyName || "").trim();

  if (!fullName || !email || !password || !companyName) {
    return res.status(400).json({ success: false, message: "Full name, email, password and company name are required" });
  }

  if (!["industry", "buyer", "transporter", "regulator"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid account role" });
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    return res.status(409).json({ success: false, message: "An account with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    fullName,
    email,
    phone: req.body.phone || null,
    password: passwordHash,
    role,
    status: "active"
  });

  await Company.create({
    userId: user.id,
    companyName,
    companyType: role,
    tinNumber: req.body.tin || null,
    email,
    phone: req.body.phone || null,
    district: req.body.district || null,
    sector: req.body.sector || null,
    address: req.body.address || null,
    licenseDocument: req.body.licenseDocument || null,
    verificationStatus: "pending"
  });

  const safeUser = await withCompany(user);

  return res.status(201).json({
    success: true,
    message: "Registration successful. Your company profile is pending admin verification, but you can log in now.",
    user: safeUser,
    token: signToken(user),
    redirectTo: roleRedirects[role] || "/login"
  });
};

exports.login = async (req, res) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  if (user.status === "suspended") {
    return res.status(403).json({ success: false, message: "This account has been suspended. Contact the platform admin." });
  }

  const safeUser = await withCompany(user);

  return res.json({
    success: true,
    message: "Login successful",
    user: safeUser,
    token: signToken(user),
    redirectTo: roleRedirects[user.role] || "/login"
  });
};

exports.me = async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  return res.json({
    success: true,
    user: await withCompany(user),
    roles
  });
};

exports.forgotPassword = async (req, res) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  const user = await User.findOne({ where: { email } });

  if (!user) {
    return res.status(404).json({ success: false, message: "No account found with this email" });
  }

  const resetCode = String(Math.floor(100000 + Math.random() * 900000));
  user.resetCode = resetCode;
  user.resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  return res.json({
    success: true,
    message: "A password reset code has been generated. In this academic prototype (no email server is connected) the code is returned directly below instead of being emailed.",
    resetCode,
    expiresInMinutes: 15
  });
};

exports.resetPassword = async (req, res) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  const code = String(req.body.code || "").trim();
  const newPassword = String(req.body.newPassword || "");

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
  }

  const user = await User.findOne({ where: { email } });
  if (!user || !user.resetCode || user.resetCode !== code) {
    return res.status(400).json({ success: false, message: "Invalid reset code" });
  }

  if (!user.resetCodeExpires || new Date(user.resetCodeExpires).getTime() < Date.now()) {
    return res.status(400).json({ success: false, message: "Reset code has expired. Please request a new one." });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetCode = null;
  user.resetCodeExpires = null;
  await user.save();

  return res.json({ success: true, message: "Password has been reset. You can now log in with your new password." });
};
