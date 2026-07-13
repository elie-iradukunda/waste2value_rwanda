const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const WasteRequest = sequelize.define("WasteRequest", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  status: {
    type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED"),
    defaultValue: "PENDING"
  },
  message: {
    type: DataTypes.TEXT
  },
  requestedQuantity: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  requestedUnit: {
    type: DataTypes.STRING(12),
    allowNull: true
  },
  proposedPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  contactName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  preferredPickupDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  deliveryLocation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  decisionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  listingId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  recyclerCompanyId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  indexes: [
    { fields: ["listingId"] },
    { fields: ["status"] }
  ]
});

module.exports = WasteRequest;
