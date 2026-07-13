const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const WasteListing = sequelize.define("WasteListing", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  imageDataUrl: {
    type: DataTypes.TEXT("long"),
    allowNull: true
  },
  imageGallery: {
    type: DataTypes.TEXT("long"),
    allowNull: true,
    get() {
      const value = this.getDataValue("imageGallery");
      if (!value) return [];
      if (Array.isArray(value)) return value;
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (_error) {
        return [];
      }
    },
    set(value) {
      if (!value || !Array.isArray(value) || !value.length) {
        this.setDataValue("imageGallery", null);
        return;
      }
      this.setDataValue("imageGallery", JSON.stringify(value));
    }
  },
  quantity: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  unit: {
    type: DataTypes.ENUM("KG", "TONNE", "M3"),
    defaultValue: "KG"
  },
  priceAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  currency: {
    type: DataTypes.STRING(8),
    defaultValue: "RWF"
  },
  priceType: {
    type: DataTypes.STRING(20),
    defaultValue: "PER_UNIT"
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lat: {
    type: DataTypes.FLOAT
  },
  lng: {
    type: DataTypes.FLOAT
  },
  status: {
    type: DataTypes.ENUM("PENDING_APPROVAL", "APPROVED", "REJECTED", "MATCHED", "IN_TRANSIT", "DELIVERED", "CERTIFIED"),
    defaultValue: "PENDING_APPROVAL"
  },
  quality: {
    type: DataTypes.ENUM("A", "B", "C"),
    allowNull: true
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  producerCompanyId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  indexes: [
    { fields: ["status"] },
    { fields: ["categoryId"] }
  ]
});

module.exports = WasteListing;
