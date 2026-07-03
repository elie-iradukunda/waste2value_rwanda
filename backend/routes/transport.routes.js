const router = require("express").Router();
const controller = require("../controllers/platform.controller");

router.get("/dashboard", controller.dashboard("transporter"));
router.get("/jobs", controller.list("transportJobs"));
router.post("/jobs", controller.createTransportJob);
router.patch("/jobs/:id/status", controller.updateStatus("Transport job"));
router.post("/jobs/:id/proof", (req, res) => res.status(201).json({
  success: true,
  message: "Proof of pickup or delivery uploaded",
  jobId: Number(req.params.id),
  proofType: req.body.proofType || "delivery",
  uploadedAt: new Date().toISOString()
}));

module.exports = router;
