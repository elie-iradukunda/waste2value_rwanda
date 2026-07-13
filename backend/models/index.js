const sequelize = require("../config/database");
const Company = require("./Company");
const User = require("./User");
const Category = require("./Category");
const WasteListing = require("./WasteListing");
const WasteRequest = require("./WasteRequest");
const TransportJob = require("./TransportJob");
const Certificate = require("./Certificate");
const Transaction = require("./Transaction");

Company.hasMany(User, { foreignKey: "companyId", as: "users" });
User.belongsTo(Company, { foreignKey: "companyId", as: "company" });

Company.hasMany(WasteListing, { foreignKey: "producerCompanyId", as: "producedListings" });
WasteListing.belongsTo(Company, { foreignKey: "producerCompanyId", as: "producerCompany" });
User.hasMany(WasteListing, { foreignKey: "createdById", as: "listings" });
WasteListing.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });

Category.hasMany(WasteListing, { foreignKey: "categoryId", as: "listings" });
WasteListing.belongsTo(Category, { foreignKey: "categoryId", as: "category" });

WasteListing.hasMany(WasteRequest, { foreignKey: "listingId", as: "requests" });
WasteRequest.belongsTo(WasteListing, { foreignKey: "listingId", as: "listing" });
Company.hasMany(WasteRequest, { foreignKey: "recyclerCompanyId", as: "requests" });
WasteRequest.belongsTo(Company, { foreignKey: "recyclerCompanyId", as: "recyclerCompany" });
User.hasMany(WasteRequest, { foreignKey: "createdById", as: "requests" });
WasteRequest.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });

WasteListing.hasOne(TransportJob, { foreignKey: "listingId", as: "job" });
TransportJob.belongsTo(WasteListing, { foreignKey: "listingId", as: "listing" });
Company.hasMany(TransportJob, { foreignKey: "providerCompanyId", as: "jobs" });
TransportJob.belongsTo(Company, { foreignKey: "providerCompanyId", as: "providerCompany" });
User.hasMany(TransportJob, { foreignKey: "handledById", as: "jobs" });
TransportJob.belongsTo(User, { foreignKey: "handledById", as: "handledBy" });

WasteListing.hasOne(Certificate, { foreignKey: "listingId", as: "certificate" });
Certificate.belongsTo(WasteListing, { foreignKey: "listingId", as: "listing" });
Company.hasMany(Certificate, { foreignKey: "producerCompanyId", as: "certsAsProducer" });
Certificate.belongsTo(Company, { foreignKey: "producerCompanyId", as: "producerCompany" });
Company.hasMany(Certificate, { foreignKey: "recyclerCompanyId", as: "certsAsRecycler" });
Certificate.belongsTo(Company, { foreignKey: "recyclerCompanyId", as: "recyclerCompany" });

User.hasMany(Transaction, { foreignKey: "actorId", as: "transactions" });
Transaction.belongsTo(User, { foreignKey: "actorId", as: "actor" });

module.exports = {
  sequelize,
  Company,
  User,
  Category,
  WasteListing,
  WasteRequest,
  TransportJob,
  Certificate,
  Transaction
};
