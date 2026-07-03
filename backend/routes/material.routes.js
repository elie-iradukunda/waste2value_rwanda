const router = require("express").Router();
const controller = require("../controllers/platform.controller");

router.get("/", controller.list("materials"));
router.post("/", controller.createMaterial);
router.get("/categories", controller.list("categories"));
router.get("/:id", controller.materialDetails);
router.patch("/:id/status", controller.updateStatus("Material"));

module.exports = router;
