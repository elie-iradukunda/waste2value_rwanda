const sequelize = require("../config/database");
const User = require("./User");
const Company = require("./Company");
const MaterialCategory = require("./MaterialCategory");
const WasteMaterial = require("./WasteMaterial");
const MaterialImage = require("./MaterialImage");
const MaterialRequest = require("./MaterialRequest");
const Transaction = require("./Transaction");
const TransportJob = require("./TransportJob");
const Certificate = require("./Certificate");
const SustainabilityScore = require("./SustainabilityScore");
const Notification = require("./Notification");
const Review = require("./Review");

User.hasOne(Company, { foreignKey: "userId", as: "company" });
Company.belongsTo(User, { foreignKey: "userId", as: "owner" });

Company.hasMany(WasteMaterial, { foreignKey: "companyId", as: "materials" });
WasteMaterial.belongsTo(Company, { foreignKey: "companyId", as: "seller" });

MaterialCategory.hasMany(WasteMaterial, { foreignKey: "categoryId", as: "materials" });
WasteMaterial.belongsTo(MaterialCategory, { foreignKey: "categoryId", as: "category" });

WasteMaterial.hasMany(MaterialImage, { foreignKey: "materialId", as: "images" });
MaterialImage.belongsTo(WasteMaterial, { foreignKey: "materialId", as: "material" });

WasteMaterial.hasMany(MaterialRequest, { foreignKey: "materialId", as: "requests" });
MaterialRequest.belongsTo(WasteMaterial, { foreignKey: "materialId", as: "material" });
MaterialRequest.belongsTo(Company, { foreignKey: "buyerCompanyId", as: "buyer" });
MaterialRequest.belongsTo(Company, { foreignKey: "sellerCompanyId", as: "seller" });

MaterialRequest.hasOne(Transaction, { foreignKey: "requestId", as: "transaction" });
Transaction.belongsTo(MaterialRequest, { foreignKey: "requestId", as: "request" });
Transaction.belongsTo(WasteMaterial, { foreignKey: "materialId", as: "material" });
Transaction.belongsTo(Company, { foreignKey: "buyerCompanyId", as: "buyer" });
Transaction.belongsTo(Company, { foreignKey: "sellerCompanyId", as: "seller" });

Transaction.hasOne(TransportJob, { foreignKey: "transactionId", as: "transportJob" });
TransportJob.belongsTo(Transaction, { foreignKey: "transactionId", as: "transaction" });
TransportJob.belongsTo(Company, { foreignKey: "transporterCompanyId", as: "transporter" });

Transaction.hasOne(Certificate, { foreignKey: "transactionId", as: "certificate" });
Certificate.belongsTo(Transaction, { foreignKey: "transactionId", as: "transaction" });

Company.hasMany(SustainabilityScore, { foreignKey: "companyId", as: "scores" });
SustainabilityScore.belongsTo(Company, { foreignKey: "companyId", as: "company" });

User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });
Notification.belongsTo(User, { foreignKey: "userId", as: "user" });

Review.belongsTo(Company, { foreignKey: "reviewerCompanyId", as: "reviewer" });
Review.belongsTo(Company, { foreignKey: "reviewedCompanyId", as: "reviewed" });
Review.belongsTo(Transaction, { foreignKey: "transactionId", as: "transaction" });

module.exports = {
  sequelize,
  User,
  Company,
  MaterialCategory,
  WasteMaterial,
  MaterialImage,
  MaterialRequest,
  Transaction,
  TransportJob,
  Certificate,
  SustainabilityScore,
  Notification,
  Review
};
