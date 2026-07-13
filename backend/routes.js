const { Router } = require("express");
const { authenticate, authorize, register, login } = require("./auth.js");
const { publicSite, admin, producer, recycler, transport, categories } = require("./workflow.js");

const router = Router();

// wrap async handlers so thrown AppErrors reach the error middleware
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).then((d) => res.json(d)).catch(next);

// ---- Auth (public) ---------------------------------------------
router.post("/auth/register", h((req) => register(req.body)));
router.post("/auth/login", h((req) => login(req.body)));
router.get("/public/marketplace", h(() => publicSite.marketplace()));
router.get("/public/producers", h(() => publicSite.producers()));

// everything below requires a valid token
router.use(authenticate);

// ---- Shared ------------------------------------------------------
router.get("/me", h((req) => req.user));
router.get("/categories", h(() => categories.list()));

// ---- Admin ---------------------------------------------------------
const asAdmin = authorize("ADMIN");
router.get("/admin/reports", asAdmin, h(() => admin.reports()));
router.get("/admin/companies/pending", asAdmin, h(() => admin.listPendingCompanies()));
router.post("/admin/companies/:id/review", asAdmin, h((req) => admin.reviewCompany(req.user, req.params.id, !!req.body.approve)));
router.get("/admin/listings/pending", asAdmin, h(() => admin.listPendingListings()));
router.get("/admin/listings/status/:status", asAdmin, h((req) => admin.listListingsByStatus(req.params.status)));
router.post("/admin/listings/:id/review", asAdmin, h((req) => admin.reviewListing(req.user, req.params.id, !!req.body.approve, req.body.quality)));
router.get("/admin/categories", asAdmin, h(() => admin.listCategories()));
router.post("/admin/categories", asAdmin, h((req) => admin.addCategory(req.body.name)));
router.patch("/admin/categories/:id", asAdmin, h((req) => admin.updateCategory(req.params.id, req.body.name)));
router.delete("/admin/categories/:id", asAdmin, h((req) => admin.deleteCategory(req.params.id)));

// ---- Producer --------------------------------------------------------
const asProducer = authorize("PRODUCER");
router.post("/listings", asProducer, h((req) => producer.createListing(req.user, req.body)));
router.get("/listings/mine", asProducer, h((req) => producer.myListings(req.user)));
router.patch("/listings/:id", asProducer, h((req) => producer.updateListing(req.user, req.params.id, req.body)));
router.get("/producer/requests", asProducer, h((req) => producer.incomingRequests(req.user)));
router.post("/requests/:id/review", asProducer, h((req) => producer.reviewRequest(req.user, req.params.id, !!req.body.approve, req.body.reason)));
router.get("/producer/certificates", asProducer, h((req) => producer.myCertificates(req.user)));
router.get("/producer/transport-staff", asProducer, h((req) => producer.transportStaff(req.user)));
router.post("/producer/transport-staff", asProducer, h((req) => producer.createTransportStaff(req.user, req.body)));

// ---- Recycler / SME ----------------------------------------------------
const asRecycler = authorize("RECYCLER");
router.get("/marketplace", asRecycler, h((req) => recycler.marketplace({ q: req.query.q, categoryId: req.query.categoryId })));
router.post("/listings/:id/requests", asRecycler, h((req) => recycler.createRequest(req.user, req.params.id, req.body)));
router.get("/requests/mine", asRecycler, h((req) => recycler.myRequests(req.user)));
router.post("/listings/:id/confirm-receipt", asRecycler, h((req) => recycler.confirmReceipt(req.user, req.params.id, req.body)));
router.get("/recycler/certificates", asRecycler, h((req) => recycler.myCertificates(req.user)));

// ---- Transport -----------------------------------------------------
const asTransport = authorize("TRANSPORT");
router.get("/transport/jobs", asTransport, h((req) => transport.jobs(req.user)));
router.post("/transport/jobs/:id/advance", asTransport, h((req) => transport.advance(req.user, req.params.id, req.body)));

module.exports = router;
