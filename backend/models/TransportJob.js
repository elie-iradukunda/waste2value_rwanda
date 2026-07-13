const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TransportJob = sequelize.define("TransportJob", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  status: {
    type: DataTypes.ENUM("WAITING", "PICKED_UP", "IN_TRANSIT", "DELIVERED"),
    defaultValue: "WAITING"
  },
  pickupLocation: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dropoffLocation: {
    type: DataTypes.STRING
  },
  driverName: {
    type: DataTypes.STRING
  },
  driverPhone: {
    type: DataTypes.STRING
  },
  vehiclePlate: {
    type: DataTypes.STRING
  },
  pickupQuantity: {
    type: DataTypes.DECIMAL(12, 2)
  },
  pickupUnit: {
    type: DataTypes.STRING(12)
  },
  pickupCondition: {
    type: DataTypes.STRING(32)
  },
  pickupNotes: {
    type: DataTypes.TEXT
  },
  pickupPhotoDataUrl: {
    type: DataTypes.TEXT("long")
  },
  pickedUpAt: {
    type: DataTypes.DATE
  },
  deliveryQuantity: {
    type: DataTypes.DECIMAL(12, 2)
  },
  deliveryUnit: {
    type: DataTypes.STRING(12)
  },
  deliveryCondition: {
    type: DataTypes.STRING(32)
  },
  deliveryLocation: {
    type: DataTypes.STRING
  },
  receiverName: {
    type: DataTypes.STRING
  },
  receiverPhone: {
    type: DataTypes.STRING
  },
  deliveryNotes: {
    type: DataTypes.TEXT
  },
  deliveryPhotoDataUrl: {
    type: DataTypes.TEXT("long")
  },
  deliveredAt: {
    type: DataTypes.DATE
  },
  listingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  providerCompanyId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  handledById: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  indexes: [
    { fields: ["status"] }
  ]
});

module.exports = TransportJob;
