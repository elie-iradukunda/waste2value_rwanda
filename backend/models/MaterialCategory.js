const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MaterialCategory = sequelize.define("MaterialCategory", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT
  },
  icon: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM("active", "inactive"),
    defaultValue: "active"
  }
});

module.exports = MaterialCategory;
