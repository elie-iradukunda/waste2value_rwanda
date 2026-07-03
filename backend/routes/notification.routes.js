const router = require("express").Router();
const controller = require("../controllers/platform.controller");

router.get("/", controller.notifications);
router.patch("/:id/read", controller.markNotificationRead);

module.exports = router;
