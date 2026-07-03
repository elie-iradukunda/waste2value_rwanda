const router = require("express").Router();
const controller = require("../controllers/platform.controller");

router.get("/", controller.list("transactions"));
router.patch("/:id/status", controller.updateStatus("Transaction"));

module.exports = router;
