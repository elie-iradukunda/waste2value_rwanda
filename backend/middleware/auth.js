const jwt = require("jsonwebtoken");

exports.authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication token required" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "wastetovalue-dev-secret");
    return next();
  } catch (_error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: "Permission denied" });
  }

  return next();
};
