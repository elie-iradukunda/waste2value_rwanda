const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Certificate = sequelize.define("Certificate", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  transactionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  certificateNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  materialType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantityReused: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sellerCompanyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  buyerCompanyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  transporterName: {
    type: DataTypes.STRING
  },
  issueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  qrCodeUrl: {
    type: DataTypes.STRING
  },
  pdfUrl: {
    type: DataTypes.STRING
  },
  verificationStatus: {
    type: DataTypes.ENUM("pending", "verified", "revoked"),
    defaultValue: "verified"
  }
}, {
  updatedAt: false
});

module.exports = Certificate;
