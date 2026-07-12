const express = require("express");
const controller = require("./admin.controller");
const {
  verifyToken,
  requireRole,
} = require("../../middleware/auth.middleware");

const router = express.Router();

router.use(verifyToken, requireRole("admin"));

router.get("/dashboard-stats", controller.dashboardStats);

module.exports = router;
