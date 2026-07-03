const router = require("express").Router();
const controller = require("../controllers/platform.controller");
const { companies } = require("../data/mockData");

router.get("/", controller.list("companies"));
router.get("/rankings", (_req, res) => {
  res.json({
    success: true,
    rankings: [...companies]
      .sort((a, b) => b.sustainabilityScore - a.sustainabilityScore)
      .map((company, index) => ({ rank: index + 1, ...company }))
  });
});
router.patch("/:id/verify", controller.updateStatus("Company verification"));

module.exports = router;
