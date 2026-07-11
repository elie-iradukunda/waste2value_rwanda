const router = require("express").Router();
const controller = require("../controllers/category.controller");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/", controller.list);
router.post("/", authenticate, authorize("admin"), controller.create);
router.patch("/:id/status", authenticate, authorize("admin"), controller.setStatus);

module.exports = router;
