const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const models = require("./models");
const platformController = require("./controllers/platform.controller");

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.includes("localhost")) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Waste2Value Rwanda API is running",
    databaseSync: process.env.DB_SYNC === "true"
  });
});

app.get("/api/public/home", platformController.home);
app.get("/api/dashboards/industry", platformController.dashboard("industry"));
app.get("/api/dashboards/buyer", platformController.dashboard("buyer"));
app.get("/api/dashboards/regulator", platformController.dashboard("regulator"));

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/companies", require("./routes/company.routes"));
app.use("/api/materials", require("./routes/material.routes"));
app.use("/api/requests", require("./routes/request.routes"));
app.use("/api/transactions", require("./routes/transaction.routes"));
app.use("/api/transport", require("./routes/transport.routes"));
app.use("/api/certificates", require("./routes/certificate.routes"));
app.use("/api/analytics", require("./routes/analytics.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));

const frontendDistPath = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    return res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ success: false, message: "API route not found" });
  }
  return res.status(404).send("Waste2Value Rwanda page not found");
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Server error"
  });
});

async function start() {
  if (process.env.DB_SYNC === "true") {
    await models.sequelize.authenticate();
    await models.sequelize.sync({ alter: process.env.DB_ALTER === "true" });
    console.log("MySQL connected and Sequelize models synced");
  }

  app.listen(port, () => {
    console.log(`Waste2Value API listening on http://localhost:${port}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error("Failed to start API", error);
    process.exit(1);
  });
}

module.exports = app;
module.exports.start = start;
