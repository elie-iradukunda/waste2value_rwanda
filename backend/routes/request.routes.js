const router = require("express").Router();
const controller = require("../controllers/platform.controller");

router.get("/", controller.list("materialRequests"));
router.post("/", controller.createRequest);
router.patch("/:id/status", controller.updateStatus("Request"));

module.exports = router;
