const router = require("express").Router();
const controller = require("../controllers/dashboard.controller");
const transportController = require("../controllers/transport.controller");
const analyticsController = require("../controllers/analytics.controller");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/industry", authenticate, authorize("industry", "admin"), controller.industryDashboard);
router.get("/buyer", authenticate, authorize("buyer", "admin"), controller.buyerDashboard);
router.get("/transporter", authenticate, authorize("transporter", "admin"), transportController.dashboard);
router.get("/regulator", authenticate, authorize("regulator", "admin"), analyticsController.regulatorDashboard);

module.exports = router;
