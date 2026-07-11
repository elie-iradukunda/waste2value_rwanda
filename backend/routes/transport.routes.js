const router = require("express").Router();
const controller = require("../controllers/transport.controller");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/dashboard", authenticate, authorize("transporter", "admin"), controller.dashboard);
router.get("/jobs", authenticate, authorize("transporter", "admin", "buyer", "regulator"), controller.jobs);
router.patch("/jobs/:id/status", authenticate, authorize("transporter", "admin", "buyer"), controller.updateStatus);

module.exports = router;
