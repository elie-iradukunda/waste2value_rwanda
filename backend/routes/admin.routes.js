const router = require("express").Router();
const controller = require("../controllers/admin.controller");
const analyticsController = require("../controllers/analytics.controller");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate, authorize("admin"));

router.get("/dashboard", controller.dashboard);
router.get("/users", controller.users);
router.patch("/users/:id/status", controller.suspendUser);
router.patch("/users/:id/company-verification", controller.verifyUserCompany);
router.get("/approvals", controller.approvals);
router.patch("/approvals/:type/:id", controller.resolveApproval);
router.get("/reports", analyticsController.reports);

module.exports = router;
