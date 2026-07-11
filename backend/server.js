const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const models = require("./models");
const publicController = require("./controllers/public.controller");
const { ensureDemoData } = require("./services/demoSeedService");

const app = express();
const port = process.env.PORT || 5000;
const railwayOrigin = process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "";
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .concat([railwayOrigin, process.env.PUBLIC_APP_URL || ""])
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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Waste-to-Value Rwanda API is running",
    databaseSync: process.env.DB_SYNC === "true"
  });
});

app.get("/api/public/home", publicController.home);

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/companies", require("./routes/company.routes"));
app.use("/api/categories", require("./routes/category.routes"));
app.use("/api/materials", require("./routes/material.routes"));
app.use("/api/requests", require("./routes/request.routes"));
app.use("/api/transport", require("./routes/transport.routes"));
app.use("/api/certificates", require("./routes/certificate.routes"));
app.use("/api/analytics", require("./routes/analytics.routes"));
app.use("/api/dashboards", require("./routes/dashboard.routes"));

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
  return res.status(404).send("Waste-to-Value Rwanda page not found");
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Server error"
  });
});

async function start() {
  const shouldSyncDatabase = process.env.DB_SYNC === "true" || process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT);
  if (shouldSyncDatabase) {
    await models.sequelize.authenticate();
    await models.sequelize.sync({ alter: process.env.DB_ALTER === "true" });
    const seeded = process.env.SEED_DEMO_DATA === "false" ? null : await ensureDemoData();
    console.log(seeded
      ? `MySQL connected, models synced, and demo data ready (${seeded.users} users, ${seeded.materials} materials).`
      : "MySQL connected and Sequelize models synced.");
  }

  app.listen(port, () => {
    console.log(`Waste-to-Value Rwanda API listening on http://localhost:${port}`);
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
