const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MaterialImage = sequelize.define("MaterialImage", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  materialId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isMain: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  updatedAt: false
});

module.exports = MaterialImage;
