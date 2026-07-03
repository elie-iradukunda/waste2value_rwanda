const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Transaction = sequelize.define("Transaction", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  requestId: {
    type: DataTypes.INTEGER,
    allowNull: false
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
  quantity: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  totalAmount: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  paymentStatus: {
    type: DataTypes.ENUM("unpaid", "pending", "paid", "refunded"),
    defaultValue: "unpaid"
  },
  transactionStatus: {
    type: DataTypes.ENUM("waiting_transport", "in_transit", "delivered", "completed", "cancelled"),
    defaultValue: "waiting_transport"
  }
});

module.exports = Transaction;
