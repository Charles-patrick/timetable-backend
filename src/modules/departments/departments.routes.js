const express = require("express");
const controller = require("./departments.controller");
const {
  verifyToken,
  requireRole,
} = require("../../middleware/auth.middleware");

const router = express.Router();

// Public — no login. Powers the department picker on the public timetable page.
router.get("/public", controller.publicList);

router.use(verifyToken, requireRole("admin"));

router.get("/", controller.list);
router.post("/", controller.create);
router.get("/:id", controller.getOne);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
