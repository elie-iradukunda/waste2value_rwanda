const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { DataTypes } = require("sequelize");
require("dotenv").config();

const models = require("./models");
const apiRoutes = require("./routes.js");
const { AppError } = require("./workflow.js");

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
app.use(express.json({ limit: "12mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Waste-to-Value Rwanda API is running",
    databaseSync: process.env.DB_SYNC === "true"
  });
});

app.use("/api", apiRoutes);

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
  if (error instanceof AppError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
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
    await models.sequelize.sync();
    await ensureCompatibilitySchema();
    console.log("MySQL connected and Sequelize models synced. Run `node seed.js` to populate demo data.");
  }

  app.listen(port, () => {
    console.log(`Waste-to-Value Rwanda API listening on http://localhost:${port}`);
  });
}

async function ensureCompatibilitySchema() {
  const queryInterface = models.sequelize.getQueryInterface();
  await addMissingColumns(queryInterface, models.Company.getTableName(), [
    ["registrationNumber", { type: DataTypes.STRING, allowNull: true }],
    ["businessLocation", { type: DataTypes.STRING, allowNull: true }],
    ["producedMaterials", { type: DataTypes.TEXT, allowNull: true }],
    ["productionDescription", { type: DataTypes.TEXT, allowNull: true }],
    ["rdbDocumentName", { type: DataTypes.STRING, allowNull: true }],
    ["rdbDocumentDataUrl", { type: DataTypes.TEXT("long"), allowNull: true }]
  ]);

  await addMissingColumns(queryInterface, models.WasteListing.getTableName(), [
    ["imageGallery", { type: DataTypes.TEXT("long"), allowNull: true }],
    ["priceAmount", { type: DataTypes.DECIMAL(12, 2), allowNull: true }],
    ["currency", { type: DataTypes.STRING(8), allowNull: true, defaultValue: "RWF" }],
    ["priceType", { type: DataTypes.STRING(20), allowNull: true, defaultValue: "PER_UNIT" }]
  ]);

  await addMissingColumns(queryInterface, models.WasteRequest.getTableName(), [
    ["requestedQuantity", { type: DataTypes.DECIMAL(12, 2), allowNull: true }],
    ["requestedUnit", { type: DataTypes.STRING(12), allowNull: true }],
    ["proposedPrice", { type: DataTypes.DECIMAL(12, 2), allowNull: true }],
    ["contactName", { type: DataTypes.STRING, allowNull: true }],
    ["contactPhone", { type: DataTypes.STRING, allowNull: true }],
    ["preferredPickupDate", { type: DataTypes.DATEONLY, allowNull: true }],
    ["deliveryLocation", { type: DataTypes.STRING, allowNull: true }]
  ]);

  await addMissingColumns(queryInterface, models.TransportJob.getTableName(), [
    ["dropoffLocation", { type: DataTypes.STRING, allowNull: true }],
    ["driverName", { type: DataTypes.STRING, allowNull: true }],
    ["driverPhone", { type: DataTypes.STRING, allowNull: true }],
    ["vehiclePlate", { type: DataTypes.STRING, allowNull: true }],
    ["pickupQuantity", { type: DataTypes.DECIMAL(12, 2), allowNull: true }],
    ["pickupUnit", { type: DataTypes.STRING(12), allowNull: true }],
    ["pickupCondition", { type: DataTypes.STRING(32), allowNull: true }],
    ["pickupNotes", { type: DataTypes.TEXT, allowNull: true }],
    ["pickupPhotoDataUrl", { type: DataTypes.TEXT("long"), allowNull: true }],
    ["deliveryQuantity", { type: DataTypes.DECIMAL(12, 2), allowNull: true }],
    ["deliveryUnit", { type: DataTypes.STRING(12), allowNull: true }],
    ["deliveryCondition", { type: DataTypes.STRING(32), allowNull: true }],
    ["deliveryLocation", { type: DataTypes.STRING, allowNull: true }],
    ["receiverName", { type: DataTypes.STRING, allowNull: true }],
    ["receiverPhone", { type: DataTypes.STRING, allowNull: true }],
    ["deliveryNotes", { type: DataTypes.TEXT, allowNull: true }],
    ["deliveryPhotoDataUrl", { type: DataTypes.TEXT("long"), allowNull: true }]
  ]);

  await addMissingColumns(queryInterface, models.Certificate.getTableName(), [
    ["receiptCondition", { type: DataTypes.STRING(32), allowNull: true }],
    ["receiverName", { type: DataTypes.STRING, allowNull: true }],
    ["receiverPhone", { type: DataTypes.STRING, allowNull: true }],
    ["receiptLocation", { type: DataTypes.STRING, allowNull: true }],
    ["receiptNotes", { type: DataTypes.TEXT, allowNull: true }],
    ["receiptConfirmedAt", { type: DataTypes.DATE, allowNull: true }]
  ]);
}

async function addMissingColumns(queryInterface, tableName, missingColumns) {
  const columns = await queryInterface.describeTable(tableName).catch(() => null);
  if (!columns) return;

  for (const [name, definition] of missingColumns) {
    if (!columns[name]) {
      await queryInterface.addColumn(tableName, name, definition);
    }
  }
}

if (require.main === module) {
  start().catch((error) => {
    console.error("Failed to start API", error);
    process.exit(1);
  });
}

module.exports = app;
module.exports.start = start;
