const router = require("express").Router();
const controller = require("../controllers/company.controller");
const { authenticate, authorize } = require("../middleware/auth");

router.patch("/:id/verify", authenticate, authorize("admin"), controller.verify);

module.exports = router;
