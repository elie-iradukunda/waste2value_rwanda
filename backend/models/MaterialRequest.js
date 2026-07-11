const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MaterialRequest = sequelize.define("MaterialRequest", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  materialId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  buyerCompanyId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sellerCompanyId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  requestedQuantity: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT
  },
  offeredPrice: {
    type: DataTypes.DECIMAL(12, 2)
  },
  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected", "negotiating", "cancelled"),
    defaultValue: "pending"
  },
  rejectionReason: {
    type: DataTypes.TEXT
  }
});

module.exports = MaterialRequest;
