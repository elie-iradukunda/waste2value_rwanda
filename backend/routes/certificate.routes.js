const router = require("express").Router();
const controller = require("../controllers/platform.controller");

router.get("/", controller.list("certificates"));
router.get("/verify/:number", controller.verifyCertificate);
router.post("/generate", controller.generateCertificate);

module.exports = router;
