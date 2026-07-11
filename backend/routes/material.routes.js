const router = require("express").Router();
const controller = require("../controllers/material.controller");
const { authenticate, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.get("/", controller.list);
router.get("/categories", controller.categories);
router.get("/mine", authenticate, authorize("industry", "admin"), controller.mine);
router.get("/pending-approval", authenticate, authorize("admin"), controller.pendingApproval);
router.get("/quality-queue", authenticate, authorize("regulator", "admin"), controller.qualityQueue);
router.get("/:id", controller.materialDetails);
router.post("/", authenticate, authorize("industry", "admin"), upload.single("image"), controller.createMaterial);
router.patch("/:id", authenticate, authorize("industry", "admin"), controller.updateDetails);
router.patch("/:id/status", authenticate, authorize("industry", "admin"), controller.updateStatus);
router.patch("/:id/quality", authenticate, authorize("regulator", "admin"), controller.verifyQuality);

module.exports = router;
