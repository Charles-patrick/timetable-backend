const timetableService = require("./timetable.service");
const generatorService = require("./timetableGenerator.service");
const conflictChecker = require("./conflictChecker.service");
const { buildTimetablePdf } = require("./pdfExport.service");
const { buildTimetableWorkbook } = require("./excelExport.service");
const User = require("../users/user.model");
const { AppError } = require("../../middleware/errorHandler");

async function generate(req, res, next) {
  try {
    const { semester } = req.body;
    if (!semester) {
      return res
        .status(400)
        .json({ success: false, message: "Semester is required", errors: [] });
    }
    const result = await generatorService.generateTimetable(semester);
    res
      .status(201)
      .json({ success: true, message: "Timetable generated", data: result });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { semester, level, day, search, batchId } = req.query;
    const entries = await timetableService.listTimetable({
      semester,
      level,
      day,
      search,
      batchId,
    });
    res.status(200).json({ success: true, message: "OK", data: { entries } });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const entry = await timetableService.getTimetableEntryById(req.params.id);
    res.status(200).json({ success: true, message: "OK", data: { entry } });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const entry = await timetableService.updateTimetableEntry(
      req.params.id,
      req.body,
    );
    res
      .status(200)
      .json({
        success: true,
        message: "Timetable entry updated",
        data: { entry },
      });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await timetableService.deleteTimetableEntry(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Timetable entry deleted", data: {} });
  } catch (err) {
    next(err);
  }
}

async function conflicts(req, res, next) {
  try {
    const { semester, batchId } = req.query;
    if (!semester) {
      return res
        .status(400)
        .json({ success: false, message: "Semester is required", errors: [] });
    }
    const report = await conflictChecker.detectSavedConflicts(
      semester,
      batchId,
    );
    res.status(200).json({ success: true, message: "OK", data: report });
  } catch (err) {
    next(err);
  }
}

// Public + lecturer view: same listing logic, just exposed without admin gating
async function publicList(req, res, next) {
  try {
    const { semester, level, day, search } = req.query;
    const entries = await timetableService.listTimetable({
      semester,
      level,
      day,
      search,
    });
    res.status(200).json({ success: true, message: "OK", data: { entries } });
  } catch (err) {
    next(err);
  }
}

// Logged-in lecturer's own timetable — resolves their Lecturer profile
// from the authenticated user, then filters entries to just their courses.
async function myTimetable(req, res, next) {
  try {
    const { semester, day, search } = req.query;
    if (!semester) {
      return res
        .status(400)
        .json({ success: false, message: "Semester is required", errors: [] });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.lecturerRef) {
      throw new AppError("No lecturer profile linked to this account", 404);
    }

    const entries = await timetableService.listTimetable({
      semester,
      day,
      search,
      lecturer: user.lecturerRef,
    });
    res.status(200).json({ success: true, message: "OK", data: { entries } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  generate,
  list,
  getOne,
  update,
  remove,
  conflicts,
  publicList,
  myTimetable,
  exportPublicPdf,
  exportMyPdf,
  exportAdminPdf,
  exportPublicExcel,
  exportMyExcel,
  exportAdminExcel,
};

// ── PDF export ────────────────────────────────────────────────
// Shared helper: sets PDF response headers and pipes the generated
// document straight to the client — no temp file written to disk.
function streamPdf(res, entries, title, subtitle) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'inline; filename="timetable.pdf"');
  const doc = buildTimetablePdf({ entries, title, subtitle });
  doc.pipe(res);
}

async function exportPublicPdf(req, res, next) {
  try {
    const { semester, level, day, search } = req.query;
    if (!semester) {
      return res
        .status(400)
        .json({ success: false, message: "Semester is required", errors: [] });
    }
    const entries = await timetableService.listTimetable({
      semester,
      level,
      day,
      search,
    });
    const title = level ? `Timetable — ${level} Level` : "Timetable";
    streamPdf(res, entries, title, "");
  } catch (err) {
    next(err);
  }
}

async function exportMyPdf(req, res, next) {
  try {
    const { semester, day, search } = req.query;
    if (!semester) {
      return res
        .status(400)
        .json({ success: false, message: "Semester is required", errors: [] });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.lecturerRef) {
      throw new AppError("No lecturer profile linked to this account", 404);
    }

    const entries = await timetableService.listTimetable({
      semester,
      day,
      search,
      lecturer: user.lecturerRef,
    });
    streamPdf(res, entries, "My Timetable", user.name);
  } catch (err) {
    next(err);
  }
}

async function exportAdminPdf(req, res, next) {
  try {
    const { semester, level, day, search, batchId } = req.query;
    if (!semester) {
      return res
        .status(400)
        .json({ success: false, message: "Semester is required", errors: [] });
    }
    const entries = await timetableService.listTimetable({
      semester,
      level,
      day,
      search,
      batchId,
    });
    const title = level ? `Timetable — ${level} Level` : "Full Timetable";
    streamPdf(res, entries, title, "");
  } catch (err) {
    next(err);
  }
}

// ── Excel export ──────────────────────────────────────────────
// Shared helper: sets xlsx response headers and writes the workbook
// straight to the client — no temp file written to disk.
async function streamExcel(res, entries, title) {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", 'attachment; filename="timetable.xlsx"');
  const workbook = await buildTimetableWorkbook({ entries, title });
  await workbook.xlsx.write(res);
  res.end();
}

async function exportPublicExcel(req, res, next) {
  try {
    const { semester, level, day, search } = req.query;
    if (!semester) {
      return res
        .status(400)
        .json({ success: false, message: "Semester is required", errors: [] });
    }
    const entries = await timetableService.listTimetable({
      semester,
      level,
      day,
      search,
    });
    const title = level ? `Timetable - ${level} Level` : "Timetable";
    await streamExcel(res, entries, title);
  } catch (err) {
    next(err);
  }
}

async function exportMyExcel(req, res, next) {
  try {
    const { semester, day, search } = req.query;
    if (!semester) {
      return res
        .status(400)
        .json({ success: false, message: "Semester is required", errors: [] });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.lecturerRef) {
      throw new AppError("No lecturer profile linked to this account", 404);
    }

    const entries = await timetableService.listTimetable({
      semester,
      day,
      search,
      lecturer: user.lecturerRef,
    });
    await streamExcel(res, entries, "My Timetable");
  } catch (err) {
    next(err);
  }
}

async function exportAdminExcel(req, res, next) {
  try {
    const { semester, level, day, search, batchId } = req.query;
    if (!semester) {
      return res
        .status(400)
        .json({ success: false, message: "Semester is required", errors: [] });
    }
    const entries = await timetableService.listTimetable({
      semester,
      level,
      day,
      search,
      batchId,
    });
    const title = level ? `Timetable - ${level} Level` : "Full Timetable";
    await streamExcel(res, entries, title);
  } catch (err) {
    next(err);
  }
}
