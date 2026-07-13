const Semester = require("./semester.model");
const Session = require("../sessions/session.model");
const { AppError } = require("../../middleware/errorHandler");

async function createSemester({ name, session }) {
  if (!name || !session) {
    throw new AppError("Name and session are required", 400);
  }

  const sessionDoc = await Session.findById(session);
  if (!sessionDoc) throw new AppError("Session not found", 404);

  return Semester.create({ name, session });
}

async function listSemesters({ session } = {}) {
  const filter = {};
  if (session) filter.session = session;
  return Semester.find(filter)
    .populate("session", "name status")
    .sort({ createdAt: -1 });
}

async function getSemesterById(id) {
  const semester = await Semester.findById(id).populate(
    "session",
    "name status",
  );
  if (!semester) throw new AppError("Semester not found", 404);
  return semester;
}

// Only one semester is "active" system-wide at a time — this is what
// courses/timetable generation reads to know the current teaching period.
async function activateSemester(id) {
  const semester = await Semester.findById(id);
  if (!semester) throw new AppError("Semester not found", 404);

  await Semester.updateMany({ active: true }, { active: false });

  semester.active = true;
  await semester.save();
  return semester.populate("session", "name status");
}

async function deleteSemester(id) {
  const semester = await Semester.findByIdAndDelete(id);
  if (!semester) throw new AppError("Semester not found", 404);
}

// Used by the public timetable view (no login) — students only ever need
// to know the current semester, never the full admin list.
async function getActiveSemester() {
  return Semester.findOne({ active: true }).populate("session", "name status");
}

module.exports = {
  createSemester,
  listSemesters,
  getSemesterById,
  activateSemester,
  deleteSemester,
  getActiveSemester,
};
