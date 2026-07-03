const router = require("express").Router();
const controller = require("../controllers/platform.controller");

router.get("/", controller.analytics);
router.get("/prediction", controller.dashboard("analytics"));
router.get("/regulator", controller.dashboard("regulator"));

module.exports = router;
