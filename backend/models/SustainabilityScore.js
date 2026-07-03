const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SustainabilityScore = sequelize.define("SustainabilityScore", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reuseRate: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  completedTransactions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalWasteReused: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  listingQuality: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  deliveryCompletion: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  ratingScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  finalScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  level: {
    type: DataTypes.ENUM("Bronze", "Silver", "Gold", "Green Champion"),
    defaultValue: "Bronze"
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = SustainabilityScore;
