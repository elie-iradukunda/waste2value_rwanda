const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Company = sequelize.define("Company", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM("PRODUCER", "RECYCLER", "TRANSPORT"),
    allowNull: false
  },
  contactEmail: {
    type: DataTypes.STRING,
    validate: { isEmail: true }
  },
  phone: {
    type: DataTypes.STRING
  },
  registrationNumber: {
    type: DataTypes.STRING
  },
  businessLocation: {
    type: DataTypes.STRING
  },
  producedMaterials: {
    type: DataTypes.TEXT
  },
  productionDescription: {
    type: DataTypes.TEXT
  },
  rdbDocumentName: {
    type: DataTypes.STRING
  },
  rdbDocumentDataUrl: {
    type: DataTypes.TEXT("long")
  },
  status: {
    type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED"),
    defaultValue: "PENDING"
  }
});

module.exports = Company;
