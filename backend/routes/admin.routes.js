const router = require("express").Router();
const controller = require("../controllers/platform.controller");

router.get("/dashboard", controller.dashboard("admin"));
router.get("/users", controller.list("users"));
router.get("/companies", controller.list("companies"));
router.get("/approvals", (_req, res) => res.json({
  success: true,
  approvals: [
    { id: 1, type: "Company", title: "New industry verification", status: "pending" },
    { id: 2, type: "License", title: "Transport provider license", status: "pending" },
    { id: 3, type: "Listing", title: "Material quality report", status: "pending" }
  ]
}));
router.get("/transactions", controller.list("transactions"));
router.get("/certificates", controller.list("certificates"));
router.get("/reports", controller.analytics);
router.patch("/approvals/:id", controller.updateStatus("Approval"));

module.exports = router;
