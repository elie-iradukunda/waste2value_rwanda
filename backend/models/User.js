const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  phone: {
    type: DataTypes.STRING
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM("admin", "industry", "buyer", "transporter", "regulator"),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM("pending", "active", "suspended"),
    defaultValue: "pending"
  },
  profileImage: {
    type: DataTypes.STRING
  },
  resetCode: {
    type: DataTypes.STRING
  },
  resetCodeExpires: {
    type: DataTypes.DATE
  },
  statusReason: {
    type: DataTypes.TEXT
  }
});

module.exports = User;
