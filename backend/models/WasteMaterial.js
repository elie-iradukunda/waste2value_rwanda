const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const WasteMaterial = sequelize.define("WasteMaterial", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  quantity: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  unit: {
    type: DataTypes.ENUM("kg", "tons", "bags", "pieces"),
    defaultValue: "kg"
  },
  condition: {
    type: DataTypes.STRING
  },
  price: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  isFree: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  district: {
    type: DataTypes.STRING
  },
  sector: {
    type: DataTypes.STRING
  },
  pickupAddress: {
    type: DataTypes.STRING
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7)
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7)
  },
  status: {
    type: DataTypes.ENUM("pending_review", "available", "reserved", "sold", "expired", "rejected"),
    defaultValue: "pending_review"
  },
  availabilityDate: {
    type: DataTypes.DATEONLY
  },
  expiryDate: {
    type: DataTypes.DATEONLY
  },
  safetyNotes: {
    type: DataTypes.TEXT
  },
  reuseSuggestions: {
    type: DataTypes.TEXT
  }
});

module.exports = WasteMaterial;
