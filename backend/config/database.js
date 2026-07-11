const { Sequelize } = require("sequelize");
require("dotenv").config();

const commonOptions = {
  dialect: "mysql",
  logging: process.env.DB_LOGGING === "true" ? console.log : false,
  define: {
    timestamps: true
  },
  dialectOptions: process.env.DB_SSL === "true" ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
};

const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, commonOptions)
  : new Sequelize(
    process.env.DB_NAME || process.env.MYSQLDATABASE || "waste2value_rwanda",
    process.env.DB_USER || process.env.MYSQLUSER || "root",
    process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "",
    {
      ...commonOptions,
      host: process.env.DB_HOST || process.env.MYSQLHOST || "localhost",
      port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306)
    }
  );

module.exports = sequelize;
