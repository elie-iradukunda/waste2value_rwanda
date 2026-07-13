const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Transaction = sequelize.define("Transaction", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  meta: {
    type: DataTypes.JSON,
    allowNull: true
  },
  actorId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  listingId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  updatedAt: false,
  indexes: [
    { fields: ["type"] },
    { fields: ["createdAt"] }
  ]
});

module.exports = Transaction;
