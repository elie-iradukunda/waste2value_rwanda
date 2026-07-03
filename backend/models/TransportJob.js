const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TransportJob = sequelize.define("TransportJob", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  transactionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  transporterCompanyId: {
    type: DataTypes.INTEGER
  },
  pickupLocation: {
    type: DataTypes.STRING,
    allowNull: false
  },
  deliveryLocation: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pickupDate: {
    type: DataTypes.DATEONLY
  },
  deliveryDate: {
    type: DataTypes.DATEONLY
  },
  transportCost: {
    type: DataTypes.DECIMAL(12, 2)
  },
  status: {
    type: DataTypes.ENUM("pending", "accepted", "picked_up", "in_transit", "delivered", "confirmed", "cancelled"),
    defaultValue: "pending"
  },
  pickupProofImage: {
    type: DataTypes.STRING
  },
  deliveryProofImage: {
    type: DataTypes.STRING
  }
});

module.exports = TransportJob;
