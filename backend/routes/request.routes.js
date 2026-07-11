const router = require("express").Router();
const controller = require("../controllers/request.controller");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/", authenticate, controller.list);
router.post("/", authenticate, authorize("buyer"), controller.createRequest);
router.patch("/:id/status", authenticate, authorize("industry", "admin", "buyer"), controller.updateStatus);

module.exports = router;
