const express = require("express");
const controller = require("./sessions.controller");
const {
  verifyToken,
  requireRole,
} = require("../../middleware/auth.middleware");

const router = express.Router();

router.use(verifyToken, requireRole("admin"));

router.get("/", controller.list);
router.post("/", controller.create);
router.get("/:id", controller.getOne);
router.put("/:id/activate", controller.activate);
router.put("/:id/archive", controller.archive);
router.delete("/:id", controller.remove);

module.exports = router;
