const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Certificate = sequelize.define("Certificate", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  quantity: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  unit: {
    type: DataTypes.ENUM("KG", "TONNE", "M3"),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  receiptCondition: {
    type: DataTypes.STRING(32),
    allowNull: true
  },
  receiverName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  receiverPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  receiptLocation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  receiptNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  receiptConfirmedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  issuedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  listingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  producerCompanyId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  recyclerCompanyId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  updatedAt: false
});

module.exports = Certificate;
