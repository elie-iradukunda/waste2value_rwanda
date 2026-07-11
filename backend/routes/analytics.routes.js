const router = require("express").Router();
const controller = require("../controllers/analytics.controller");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate, authorize("admin", "regulator"));

router.get("/reports", controller.reports);
router.get("/regulator", controller.regulatorDashboard);

module.exports = router;
