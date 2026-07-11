const router = require("express").Router();
const controller = require("../controllers/certificate.controller");
const { authenticate } = require("../middleware/auth");

router.get("/", authenticate, controller.list);
router.get("/verify/:number", controller.verifyCertificate);

module.exports = router;
