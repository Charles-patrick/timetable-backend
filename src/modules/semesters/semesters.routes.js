const express = require("express");
const controller = require("./semesters.controller");
const {
  verifyToken,
  requireRole,
} = require("../../middleware/auth.middleware");

const router = express.Router();

// Public — no login. The public timetable page needs to know the current
// semester without ever seeing the full admin list.
router.get("/active", controller.getActive);

router.use(verifyToken, requireRole("admin"));

router.get("/", controller.list);
router.post("/", controller.create);
router.get("/:id", controller.getOne);
router.put("/:id/activate", controller.activate);
router.delete("/:id", controller.remove);

module.exports = router;
``