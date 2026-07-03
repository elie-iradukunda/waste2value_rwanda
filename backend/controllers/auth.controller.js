const jwt = require("jsonwebtoken");
const { users } = require("../data/mockData");

const roleRedirects = {
  admin: "/admin",
  industry: "/industry",
  buyer: "/buyer",
  transporter: "/transport",
  regulator: "/regulator"
};

const demoAccounts = [
  { email: "admin@waste2value.rw", role: "admin", password: "demo123" },
  { email: "industry@waste2value.rw", role: "industry", password: "demo123" },
  { email: "buyer@waste2value.rw", role: "buyer", password: "demo123" },
  { email: "transport@waste2value.rw", role: "transporter", password: "demo123" },
  { email: "regulator@waste2value.rw", role: "regulator", password: "demo123" }
];

function signDemoToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "waste2value-dev-secret",
    { expiresIn: "1d" }
  );
}

function publicUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

exports.login = (req, res) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  const role = String(req.body.role || "").trim();
  const password = String(req.body.password || "");
  const demoAccount = demoAccounts.find((item) => item.email === email || item.role === role);

  if (!demoAccount || (password && password !== demoAccount.password && password !== "password123")) {
    return res.status(401).json({
      success: false,
      message: "Invalid demo credentials. Use the shown email and password demo123."
    });
  }

  const user = users.find((item) => item.role === demoAccount.role) || users[0];

  res.json({
    success: true,
    message: "Login successful",
    user: publicUser(user),
    token: signDemoToken(user),
    redirectTo: roleRedirects[user.role]
  });
};

exports.register = (req, res) => {
  const role = req.body.role || req.body.accountType || "buyer";
  const nextUser = {
    id: users.length + 1,
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    role,
    status: "pending"
  };

  res.status(201).json({
    success: true,
    message: "Registration received for verification",
    user: publicUser(nextUser),
    redirectTo: roleRedirects[role] || "/login"
  });
};

exports.me = (req, res) => {
  res.json({
    success: true,
    user: publicUser(users[0]),
    demoAccounts: demoAccounts.map(({ password, ...account }) => ({ ...account, passwordHint: "demo123" })),
    roles: [
      { value: "admin", label: "Admin" },
      { value: "industry", label: "Waste Producer" },
      { value: "buyer", label: "Recycler / SME" },
      { value: "transporter", label: "Transport Provider" },
      { value: "regulator", label: "COPED / Waste Operator" }
    ]
  });
};
