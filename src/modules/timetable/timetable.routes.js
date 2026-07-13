const express = require("express");
const controller = require("./timetable.controller");
const {
  verifyToken,
  requireRole,
} = require("../../middleware/auth.middleware");

const router = express.Router();

// ── Public routes (no auth) ──────────────────────────────────
// Students/anyone can view a published timetable by semester/level.
router.get("/public", controller.publicList);
router.get("/public/export", controller.exportPublicPdf);
router.get("/public/export/excel", controller.exportPublicExcel);

// ── Lecturer routes ───────────────────────────────────────────
router.get("/my", verifyToken, requireRole("lecturer"), controller.myTimetable);
router.get(
  "/my/export",
  verifyToken,
  requireRole("lecturer"),
  controller.exportMyPdf,
);
router.get(
  "/my/export/excel",
  verifyToken,
  requireRole("lecturer"),
  controller.exportMyExcel,
);

// ── Admin routes ───────────────────────────────────────────────
router.post(
  "/generate",
  verifyToken,
  requireRole("admin"),
  controller.generate,
);
router.get(
  "/conflicts",
  verifyToken,
  requireRole("admin"),
  controller.conflicts,
);
router.get(
  "/export",
  verifyToken,
  requireRole("admin"),
  controller.exportAdminPdf,
);
router.get(
  "/export/excel",
  verifyToken,
  requireRole("admin"),
  controller.exportAdminExcel,
);
router.get("/", verifyToken, requireRole("admin"), controller.list);
router.post("/", verifyToken, requireRole("admin"), controller.createEntry);
router.get("/:id", verifyToken, requireRole("admin"), controller.getOne);
router.put("/:id", verifyToken, requireRole("admin"), controller.update);
router.delete("/:id", verifyToken, requireRole("admin"), controller.remove);

module.exports = router;
