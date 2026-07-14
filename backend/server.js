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
    await ensureCompatibilitySchema();
    await models.sequelize.sync();
    await ensureCompatibilitySchema();
    await backfillLegacyData();
    console.log("MySQL connected and Sequelize models synced. Run `node seed.js` to populate demo data.");
  }

  app.listen(port, () => {
    console.log(`Waste-to-Value Rwanda API listening on http://localhost:${port}`);
  });
}

async function ensureCompatibilitySchema() {
  const queryInterface = models.sequelize.getQueryInterface();
  const timestamps = [
    ["createdAt", { type: DataTypes.DATE, allowNull: true }],
    ["updatedAt", { type: DataTypes.DATE, allowNull: true }]
  ];

  await addMissingColumns(queryInterface, models.User.getTableName(), [
    ["name", { type: DataTypes.STRING, allowNull: true }],
    ["email", { type: DataTypes.STRING, allowNull: true }],
    ["passwordHash", { type: DataTypes.STRING, allowNull: true }],
    ["role", { type: DataTypes.STRING, allowNull: true }],
    ["companyId", { type: DataTypes.INTEGER, allowNull: true }],
    ...timestamps
  ]);

  await addMissingColumns(queryInterface, models.Company.getTableName(), [
    ["name", { type: DataTypes.STRING, allowNull: true }],
    ["type", { type: DataTypes.STRING, allowNull: true }],
    ["contactEmail", { type: DataTypes.STRING, allowNull: true }],
    ["phone", { type: DataTypes.STRING, allowNull: true }],
    ["registrationNumber", { type: DataTypes.STRING, allowNull: true }],
    ["businessLocation", { type: DataTypes.STRING, allowNull: true }],
    ["producedMaterials", { type: DataTypes.TEXT, allowNull: true }],
    ["productionDescription", { type: DataTypes.TEXT, allowNull: true }],
    ["rdbDocumentName", { type: DataTypes.STRING, allowNull: true }],
    ["rdbDocumentDataUrl", { type: DataTypes.TEXT("long"), allowNull: true }],
    ["status", { type: DataTypes.STRING, allowNull: true }],
    ...timestamps
  ]);

  await addMissingColumns(queryInterface, models.Category.getTableName(), [
    ["name", { type: DataTypes.STRING, allowNull: true }],
    ...timestamps
  ]);

  await addMissingColumns(queryInterface, models.WasteListing.getTableName(), [
    ["title", { type: DataTypes.STRING, allowNull: true }],
    ["description", { type: DataTypes.TEXT, allowNull: true }],
    ["imageDataUrl", { type: DataTypes.TEXT("long"), allowNull: true }],
    ["imageGallery", { type: DataTypes.TEXT("long"), allowNull: true }],
    ["quantity", { type: DataTypes.DECIMAL(12, 2), allowNull: true }],
    ["unit", { type: DataTypes.STRING(12), allowNull: true }],
    ["priceAmount", { type: DataTypes.DECIMAL(12, 2), allowNull: true }],
    ["currency", { type: DataTypes.STRING(8), allowNull: true, defaultValue: "RWF" }],
    ["priceType", { type: DataTypes.STRING(20), allowNull: true, defaultValue: "PER_UNIT" }],
    ["location", { type: DataTypes.STRING, allowNull: true }],
    ["lat", { type: DataTypes.FLOAT, allowNull: true }],
    ["lng", { type: DataTypes.FLOAT, allowNull: true }],
    ["status", { type: DataTypes.STRING, allowNull: true }],
    ["quality", { type: DataTypes.STRING(1), allowNull: true }],
    ["categoryId", { type: DataTypes.INTEGER, allowNull: true }],
    ["producerCompanyId", { type: DataTypes.INTEGER, allowNull: true }],
    ["createdById", { type: DataTypes.INTEGER, allowNull: true }],
    ...timestamps
  ]);

  await addMissingColumns(queryInterface, models.WasteRequest.getTableName(), [
    ["status", { type: DataTypes.STRING, allowNull: true }],
    ["message", { type: DataTypes.TEXT, allowNull: true }],
    ["requestedQuantity", { type: DataTypes.DECIMAL(12, 2), allowNull: true }],
    ["requestedUnit", { type: DataTypes.STRING(12), allowNull: true }],
    ["proposedPrice", { type: DataTypes.DECIMAL(12, 2), allowNull: true }],
    ["contactName", { type: DataTypes.STRING, allowNull: true }],
    ["contactPhone", { type: DataTypes.STRING, allowNull: true }],
    ["preferredPickupDate", { type: DataTypes.DATEONLY, allowNull: true }],
    ["deliveryLocation", { type: DataTypes.STRING, allowNull: true }],
    ["decisionReason", { type: DataTypes.TEXT, allowNull: true }],
    ["listingId", { type: DataTypes.INTEGER, allowNull: true }],
    ["recyclerCompanyId", { type: DataTypes.INTEGER, allowNull: true }],
    ["createdById", { type: DataTypes.INTEGER, allowNull: true }],
    ...timestamps
  ]);

  await addMissingColumns(queryInterface, models.TransportJob.getTableName(), [
    ["status", { type: DataTypes.STRING, allowNull: true }],
    ["pickupLocation", { type: DataTypes.STRING, allowNull: true }],
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
    ["deliveryPhotoDataUrl", { type: DataTypes.TEXT("long"), allowNull: true }],
    ["deliveredAt", { type: DataTypes.DATE, allowNull: true }],
    ["listingId", { type: DataTypes.INTEGER, allowNull: true }],
    ["providerCompanyId", { type: DataTypes.INTEGER, allowNull: true }],
    ["handledById", { type: DataTypes.INTEGER, allowNull: true }],
    ...timestamps
  ]);

  await addMissingColumns(queryInterface, models.Certificate.getTableName(), [
    ["quantity", { type: DataTypes.DECIMAL(12, 2), allowNull: true }],
    ["unit", { type: DataTypes.STRING(12), allowNull: true }],
    ["category", { type: DataTypes.STRING, allowNull: true }],
    ["receiptCondition", { type: DataTypes.STRING(32), allowNull: true }],
    ["receiverName", { type: DataTypes.STRING, allowNull: true }],
    ["receiverPhone", { type: DataTypes.STRING, allowNull: true }],
    ["receiptLocation", { type: DataTypes.STRING, allowNull: true }],
    ["receiptNotes", { type: DataTypes.TEXT, allowNull: true }],
    ["receiptConfirmedAt", { type: DataTypes.DATE, allowNull: true }],
    ["issuedAt", { type: DataTypes.DATE, allowNull: true }],
    ["listingId", { type: DataTypes.INTEGER, allowNull: true }],
    ["producerCompanyId", { type: DataTypes.INTEGER, allowNull: true }],
    ["recyclerCompanyId", { type: DataTypes.INTEGER, allowNull: true }],
    ["createdAt", { type: DataTypes.DATE, allowNull: true }]
  ]);

  await addMissingColumns(queryInterface, models.Transaction.getTableName(), [
    ["type", { type: DataTypes.STRING, allowNull: true }],
    ["message", { type: DataTypes.TEXT, allowNull: true }],
    ["meta", { type: DataTypes.JSON, allowNull: true }],
    ["actorId", { type: DataTypes.INTEGER, allowNull: true }],
    ["listingId", { type: DataTypes.INTEGER, allowNull: true }],
    ["createdAt", { type: DataTypes.DATE, allowNull: true }]
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

async function backfillLegacyData() {
  await models.sequelize.query(`
    UPDATE ${models.User.getTableName()}
    SET name = CASE
      WHEN email = 'admin@wastetovalue.rw' THEN 'Alain Fred NIYOGUSHIMWA'
      WHEN email = 'industry@wastetovalue.rw' THEN 'Eric Nkurunziza'
      WHEN email = 'buyer@wastetovalue.rw' THEN 'Grace Mukamana'
      WHEN email = 'transport@wastetovalue.rw' THEN 'Patrick Habimana'
      ELSE COALESCE(NULLIF(SUBSTRING_INDEX(email, '@', 1), ''), 'Platform User')
    END
    WHERE name IS NULL OR name = ''
  `).catch(() => null);

  await models.sequelize.query(`
    UPDATE ${models.Company.getTableName()}
    SET type = UPPER(type),
        status = COALESCE(NULLIF(UPPER(status), ''), 'PENDING')
    WHERE type <> UPPER(type) OR status IS NULL OR status = '' OR status <> UPPER(status)
  `).catch(() => null);

  await models.sequelize.query(`
    UPDATE ${models.User.getTableName()}
    SET role = UPPER(role)
    WHERE role IS NOT NULL AND role <> UPPER(role)
  `).catch(() => null);

  await models.sequelize.query(`
    UPDATE ${models.WasteListing.getTableName()}
    SET currency = COALESCE(NULLIF(currency, ''), 'RWF'),
        priceType = COALESCE(NULLIF(priceType, ''), 'PER_UNIT'),
        unit = COALESCE(NULLIF(UPPER(unit), ''), 'KG'),
        status = COALESCE(NULLIF(UPPER(status), ''), 'PENDING_APPROVAL'),
        quality = NULLIF(UPPER(quality), '')
    WHERE currency IS NULL OR currency = '' OR priceType IS NULL OR priceType = '' OR status IS NULL OR status = ''
       OR unit IS NULL OR unit = '' OR status <> UPPER(status) OR unit <> UPPER(unit) OR quality <> UPPER(quality)
  `).catch(() => null);

  await models.sequelize.query(`
    UPDATE ${models.WasteRequest.getTableName()}
    SET status = COALESCE(NULLIF(UPPER(status), ''), 'PENDING')
    WHERE status IS NULL OR status = '' OR status <> UPPER(status)
  `).catch(() => null);

  await models.sequelize.query(`
    UPDATE ${models.TransportJob.getTableName()}
    SET status = COALESCE(NULLIF(UPPER(status), ''), 'WAITING')
    WHERE status IS NULL OR status = '' OR status <> UPPER(status)
  `).catch(() => null);

  await models.sequelize.query(`
    UPDATE ${models.Transaction.getTableName()}
    SET type = COALESCE(NULLIF(type, ''), 'LEGACY_EVENT'),
        message = COALESCE(NULLIF(message, ''), 'Legacy platform activity')
    WHERE type IS NULL OR type = '' OR message IS NULL OR message = ''
  `).catch(() => null);
}

if (require.main === module) {
  start().catch((error) => {
    console.error("Failed to start API", error);
    process.exit(1);
  });
}

module.exports = app;
module.exports.start = start;
