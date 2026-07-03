const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Company = sequelize.define("Company", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  companyType: {
    type: DataTypes.ENUM("industry", "buyer", "transporter", "regulator", "admin"),
    allowNull: false
  },
  tinNumber: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING,
    validate: { isEmail: true }
  },
  phone: {
    type: DataTypes.STRING
  },
  district: {
    type: DataTypes.STRING
  },
  sector: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.STRING
  },
  verificationStatus: {
    type: DataTypes.ENUM("pending", "verified", "rejected"),
    defaultValue: "pending"
  },
  licenseDocument: {
    type: DataTypes.STRING
  },
  sustainabilityScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = Company;
